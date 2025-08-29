// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";


/**
 * @title TateematyToken
 * @dev ERC-20 token for rewarding parents who complete their children's vaccination schedules
 * Only the owner can mint rewards to parents
 */
contract TateematyToken is ERC20, Ownable, Pausable {
    uint256 public constant REWARD_FOR_FULL_COMPLETION = 500 * 10**18; // 500 TAT
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;           // 1 million TAT

    mapping(address => mapping(bytes32 => bool)) public childRewarded; // parent => childId hash => rewarded

    uint256 public totalRewardsDistributed;
    uint256 public totalParentsRewarded;
    mapping(address => uint256) public parentTotalClaimed;

    // Events
    event VaccinationRewarded(address indexed parent, string childId, uint256 rewardAmount, uint256 timestamp);

    /**
     * @dev Constructor sets deployer as owner and mints initial supply
     */
    constructor() ERC20("TATEEMATY", "TAT") Ownable(msg.sender) {
        _mint(msg.sender, 100_000 * 10**18); // initial supply to deployer
    }

    /**
     * @dev Admin-only function to reward a parent for full vaccination
     * @param parent Parent address to receive reward
     * @param childId Child identifier to prevent duplicate rewards
     */
    function rewardParent(address parent, string calldata childId) external onlyOwner whenNotPaused {
        require(parent != address(0), "Invalid parent address");
        require(bytes(childId).length > 0, "Invalid childId");

        bytes32 childKey = keccak256(bytes(childId));
        require(!childRewarded[parent][childKey], "Already rewarded for this child");

        uint256 reward = REWARD_FOR_FULL_COMPLETION;
        require(totalSupply() + reward <= MAX_SUPPLY, "Exceeds max supply");

        // Record the reward
        childRewarded[parent][childKey] = true;
        parentTotalClaimed[parent] += reward;
        totalRewardsDistributed += reward;

        if (parentTotalClaimed[parent] == reward) {
            totalParentsRewarded++;
        }

        _mint(parent, reward);

        emit VaccinationRewarded(parent, childId, reward, block.timestamp);
    }

    // Emergency pause/unpause
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Contract stats
    function getStats() external view returns (uint256 supply, uint256 rewards, uint256 parents) {
        return (totalSupply(), totalRewardsDistributed, totalParentsRewarded);
    }

    // Override ERC20 hooks to enforce pause
    function _update(address from, address to, uint256 value) internal override {
        require(!paused(), "Token transfer while paused");
        super._update(from, to, value);
    }
}