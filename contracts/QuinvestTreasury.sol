// SPDX-License-Identifier: GPL-3.0-only
// by louislee

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IQNVToken {
    function _burn(address burnAddress, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);

    function _mint(address mintAddress, uint256 amount) external;
}

contract QuinvestTreasury is Pausable, Ownable, ReentrancyGuard {
    IQNVToken public rQNVToken;
    IQNVToken public yQNVToken;
    IERC20 public stableToken;

    // reward cycle 1min 1 * 60 for test.
    // uint256 public rewardCycle = 60;

    // reward cycle for production a week
    int256 public rewardCycle = 604800;

    //7 Days (7 * 24 * 60 * 60)
    uint256 public weekPlanDuration = 604800; //set this value 0 when test claim.

    // 30 Days (30 * 24 * 60 * 60)
    uint256 public monthPlanDuration = 2592000;

    // 90 Days (90 * 24 * 60 * 60)
    uint256 public threeMonthPlanDuration = 7776000;

    // reward rate per week of each plan
    uint8 public interestRateWeekPlan = 5;
    uint8 public interestRateMonthPlan = 5;
    uint8 public interestRateThreeMonthPlan = 5;
    uint8 public totalStakers;

    /*
     * startTS : start time
     * endTS   : end time
     * claimedTS : the last claimed time.
     * amount : user staked amount
     * interestRate : reward rate per week of the plan user selected.
     */
    struct StakeInfo {
        uint256 startTS;
        uint256 endTS;
        uint256 claimedTS;
        uint256 amount;
        uint256 interestRate;
        uint256 claimed;
    }

    event Staked(address indexed from, uint256 amount);
    event Claimed(address indexed from, uint256 amount);

    mapping(address => StakeInfo) public stakeInfos;
    mapping(address => bool) public addressStaked;

    constructor(
        address _rQNVAddress, // ERC20 token to check the reward amount
        address _yQNVAddress, // ERC20 token to check the staked amount
        address _stableTokenAddress // ERC20 token to be staked
    ) {
        require(
            (_rQNVAddress != address(0) && _yQNVAddress != address(0)),
            "Token Address cannot be address 0"
        );
        yQNVToken = IQNVToken(_yQNVAddress);
        rQNVToken = IQNVToken(_rQNVAddress);
        stableToken = IERC20(_stableTokenAddress);
        totalStakers = 0;
    }

    function stakeToken(
        uint256 stakeAmount,
        uint8 stakeType
    ) external whenNotPaused {
        require(stakeAmount > 0, "Stake amount should be correct");
        require(
            addressStaked[_msgSender()] == false,
            "You already participated"
        );
        require(
            stableToken.balanceOf(_msgSender()) >= stakeAmount,
            "Insufficient Balance"
        );
        uint256 duration = stakeType == 1
            ? weekPlanDuration
            : (stakeType == 2 ? monthPlanDuration : threeMonthPlanDuration);
        stakeInfos[_msgSender()] = StakeInfo({
            startTS: block.timestamp,
            endTS: block.timestamp + duration,
            claimedTS: block.timestamp,
            amount: stakeAmount,
            interestRate: stakeType == 1
                ? interestRateWeekPlan
                : (
                    stakeType == 2
                        ? interestRateMonthPlan
                        : interestRateThreeMonthPlan
                ),
            claimed: 0
        });

        // send stable token from user to the treasury
        stableToken.transferFrom(_msgSender(), address(this), stakeAmount);

        // mint QNV token to user according to the staked stable token amount
        yQNVToken._mint(_msgSender(), stakeAmount);
        uint256 rewardGift =  stakeAmount * stakeInfos[_msgSender()].interestRate / 100;
        stakeInfos[_msgSender()].claimed += rewardGift;
        rQNVToken._mint(_msgSender(), rewardGift);

        totalStakers++;
        addressStaked[_msgSender()] = true;

        emit Staked(_msgSender(), stakeAmount);
    }

    // before call this fucntion, must call getRewardAmount function.
    function claimRQNV() external whenNotPaused {
        // check the user already joined.
        require(
            addressStaked[_msgSender()] == true,
            "You are not participated"
        );

        require(
            block.timestamp - stakeInfos[_msgSender()].claimedTS > rewardCycle,
            "You can claim after a week from your last claim."
        );

        //reward per week
        uint256 rewardPerRewardCycle = (stakeInfos[_msgSender()].amount *
            stakeInfos[_msgSender()].interestRate) / 100;

        // staking period until now
        uint256 rewardPeriod;
        unchecked {
            rewardPeriod = block.timestamp - stakeInfos[_msgSender()].claimedTS;
        }
        // total reward until now
        uint256 rewardAmount;
        unchecked {
            rewardAmount = (rewardPeriod / rewardCycle) * rewardPerRewardCycle;
            stakeInfos[_msgSender()].claimedTS =
                stakeInfos[_msgSender()].claimedTS +
                (rewardPeriod / rewardCycle) *
                rewardCycle;
        }
        // mint rQNV to user
        rQNVToken._mint(_msgSender(), rewardAmount);
        stakeInfos[_msgSender()].claimed += rewardAmount;
    }

    // withdraw all USDT was staked.
    function withdrawAll() external whenNotPaused {
        require(
            addressStaked[_msgSender()] == true,
            "You are not participated"
        );

        require(
            stakeInfos[_msgSender()].endTS < block.timestamp,
            "Staking plan is not over yet."
        );

        uint stakeAmount = stakeInfos[_msgSender()].amount;

        // transfer the staked tokens excpet the penalty
        stableToken.transfer(_msgSender(), stakeAmount);
        yQNVToken._burn(_msgSender(), yQNVToken.balanceOf(_msgSender()));
        rQNVToken._burn(_msgSender(), rQNVToken.balanceOf(_msgSender()));
        addressStaked[_msgSender()] == false;
        stakeInfos[_msgSender()] = StakeInfo({
            startTS: 0,
            endTS: 0,
            claimedTS: 0,
            amount: 0,
            interestRate: 0,
            claimed: 0
        });
    }

    // redeem the USDT rewards
    function redeemUSDT() external whenNotPaused {
        require(
            addressStaked[_msgSender()] == true,
            "You are not participated"
        );

        require(
            rQNVToken.balanceOf(_msgSender()) > 0,
            "You didn't claim. Please claim first and redeem."
        );

        stableToken.transfer(_msgSender(), rQNVToken.balanceOf(_msgSender()));
        rQNVToken._burn(_msgSender(), rQNVToken.balanceOf(_msgSender()));
        stakeInfos[_msgSender()].claimed = 0;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getStakedInfo() public view returns (StakeInfo memory) {
        return stakeInfos[_msgSender()];
    }

    function withdrawFunds() external onlyOwner {
        stableToken.transfer(
            _msgSender(),
            stableToken.balanceOf(address(this))
        );
    }

    // update reward rate.
    function updateWeeklyRewardRate(
        uint8 _rewardRate,
        uint256 _stakeType
    ) external {
        if (_stakeType == 1) {
            interestRateWeekPlan = _rewardRate;
        } else if (_stakeType == 2) {
            interestRateMonthPlan = _rewardRate;
        } else {
            interestRateThreeMonthPlan = _rewardRate;
        }
    }
}
