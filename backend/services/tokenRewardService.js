const { ethers } = require('ethers');
const Child = require('../models/Child');
const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');
const VaccinationSchedule = require('../models/VaccinationSchedule');

class TokenRewardService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.wallet = null;
    this.isInitialized = false;
  }

  // Initialize the service with blockchain connection
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Get environment variables
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-vanguard.vanarchain.com';
      const privateKey = process.env.PRIVATE_KEY;
      const contractAddress = process.env.CONTRACT_ADDRESS || '0x3083AD49C27286DaB08881405F48ca50C96d80E6';

      if (!privateKey) {
        console.warn('⚠️ PRIVATE_KEY not set. Token rewards will be simulated only.');
        return;
      }

      if (!contractAddress) {
        console.warn('⚠️ CONTRACT_ADDRESS not set. Token rewards will be simulated only.');
        return;
      }

      // Initialize provider and wallet
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // TATEEMATY Token Contract ABI - using the deployed contract functions
      const contractABI = [
        "function rewardParent(address parent, string calldata childId) external",
        "function getStats() external view returns (uint256 supply, uint256 rewards, uint256 parents)",
        "function totalSupply() external view returns (uint256)",
        "function balanceOf(address account) external view returns (uint256)",
        "function name() external view returns (string)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)",
        "function pause() external",
        "function unpause() external",
        "function paused() external view returns (bool)"
      ];

      // Initialize contract
      this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
      
      // Test connection
      const name = await this.contract.name();
      const symbol = await this.contract.symbol();
      const stats = await this.contract.getStats();
      
      console.log('✅ TATEEMATY Token service initialized successfully');
      console.log('📊 Contract details:', {
        name,
        symbol,
        address: contractAddress,
        totalSupply: ethers.formatEther(stats[0]),
        totalRewardsDistributed: ethers.formatEther(stats[1]),
        totalParentsRewarded: stats[2].toString()
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize TATEEMATY token service:', error);
      console.warn('⚠️ Token rewards will be simulated only.');
    }
  }

  // Check if a child is eligible for token rewards
  async checkEligibility(childId) {
    try {
      const child = await Child.findById(childId);
      if (!child) {
        throw new Error('Child not found');
      }

      // Get vaccination records
      const vaccinationRecords = await ChildVaccinationRecord.find({ childId });
      
      // Get vaccination schedule
      const schedule = await VaccinationSchedule.find({ isRequired: true });
      
      // Calculate completion
      const completedVaccines = new Set(vaccinationRecords.map(record => record.vaccineName));
      const requiredVaccines = new Set(schedule.map(item => item.vaccineName));
      
      const completedCount = completedVaccines.size;
      const requiredCount = requiredVaccines.size;
      const isFullScheduleCompleted = completedCount >= requiredCount;
      
      return {
        eligible: isFullScheduleCompleted, // Only eligible if 100% complete
        completedCount,
        requiredCount,
        isFullScheduleCompleted,
        estimatedReward: this.calculateReward(completedCount, isFullScheduleCompleted)
      };
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  }

  // Calculate token reward amount (only for 100% completion)
  calculateReward(vaccinationCount, isFullScheduleCompleted) {
    const REWARD_FOR_FULL_COMPLETION = 500; // 500 TAT for 100% completion
    
    if (isFullScheduleCompleted) {
      return {
        baseReward: 0,
        bonusReward: 0,
        totalReward: REWARD_FOR_FULL_COMPLETION,
        message: 'Full vaccination schedule completed! You earned 500 TAT tokens.'
      };
    } else {
      return {
        baseReward: 0,
        bonusReward: 0,
        totalReward: 0,
        message: `Complete all ${vaccinationCount} vaccinations to earn 500 TAT tokens`
      };
    }
  }

  // Award tokens for vaccination completion using the TATEEMATY contract
  async awardTokens(childId, parentWalletAddress) {
    try {
      await this.initialize();
      
      if (!this.isInitialized) {
        console.log('⚠️ Token service not initialized, simulating reward...');
        return this.simulateReward(childId, parentWalletAddress);
      }

      // Check eligibility
      const eligibility = await this.checkEligibility(childId);
      
      if (!eligibility.eligible) {
        throw new Error('Child not eligible for token rewards. Must complete 100% of vaccination schedule.');
      }

      // Get child info
      const child = await Child.findById(childId);
      if (!child) {
        throw new Error('Child not found');
      }

      // Check if already rewarded for this child
      // Note: The contract has built-in protection against duplicate rewards
      
      // Call the rewardParent function on the TATEEMATY contract
      const tx = await this.contract.rewardParent(
        parentWalletAddress,
        childId
      );

      console.log('🔗 TATEEMATY reward transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ TATEEMATY reward transaction confirmed in block:', receipt.blockNumber);

      // Get updated contract stats
      const stats = await this.contract.getStats();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        reward: eligibility.estimatedReward,
        contractStats: {
          totalSupply: ethers.formatEther(stats[0]),
          totalRewardsDistributed: ethers.formatEther(stats[1]),
          totalParentsRewarded: stats[2].toString()
        },
        message: `Successfully rewarded ${parentWalletAddress} with ${eligibility.estimatedReward.totalReward} TAT for ${child.fullName}'s vaccination completion`
      };

    } catch (error) {
      console.error('Error awarding TATEEMATY tokens:', error);
      
      // Check if it's a contract error (e.g., already rewarded)
      if (error.message && error.message.includes('Already rewarded for this child')) {
        throw new Error('This child has already been rewarded with tokens. Each child can only receive one reward.');
      }
      
      throw error;
    }
  }

  // Simulate reward (when blockchain is not available)
  async simulateReward(childId, parentWalletAddress) {
    try {
      const eligibility = await this.checkEligibility(childId);
      
      return {
        success: true,
        simulated: true,
        message: 'TATEEMATY token reward simulated (blockchain not available)',
        reward: eligibility.estimatedReward,
        parentWalletAddress
      };
    } catch (error) {
      console.error('Error simulating reward:', error);
      throw error;
    }
  }

  // Get parent's token balance and claim history
  async getParentTokenInfo(parentWalletAddress) {
    try {
      await this.initialize();
      
      if (!this.isInitialized) {
        return {
          error: 'TATEEMATY token service not initialized',
          simulated: true
        };
      }

      // Get parent's token balance
      const balance = await this.contract.balanceOf(parentWalletAddress);
      
      // Get contract stats
      const stats = await this.contract.getStats();
      
      return {
        balance: ethers.formatEther(balance),
        totalSupply: ethers.formatEther(stats[0]),
        totalRewardsDistributed: ethers.formatEther(stats[1]),
        totalParentsRewarded: stats[2].toString()
      };
    } catch (error) {
      console.error('Error getting parent token info:', error);
      throw error;
    }
  }

  // Get child's claim information
  async getChildClaimInfo(childId, parentWalletAddress) {
    try {
      await this.initialize();
      
      if (!this.isInitialized) {
        return {
          error: 'TATEEMATY token service not initialized',
          simulated: true
        };
      }

      // For the TATEEMATY contract, we can't directly query if a specific child was rewarded
      // But we can check the parent's balance and provide general info
      const balance = await this.contract.balanceOf(parentWalletAddress);
      
      return {
        parentBalance: ethers.formatEther(balance),
        message: 'Check parent wallet balance for claimed tokens',
        note: 'TATEEMATY contract prevents duplicate rewards per child'
      };
    } catch (error) {
      console.error('Error getting child claim info:', error);
      throw error;
    }
  }

  // Get contract statistics
  async getContractStats() {
    try {
      await this.initialize();
      
      if (!this.isInitialized) {
        return {
          error: 'TATEEMATY token service not initialized',
          simulated: true
        };
      }

      const stats = await this.contract.getStats();
      const name = await this.contract.name();
      const symbol = await this.contract.symbol();
      const decimals = await this.contract.decimals();
      const totalSupply = await this.contract.totalSupply();
      
      return {
        name,
        symbol,
        decimals: decimals.toString(),
        totalSupply: ethers.formatEther(totalSupply),
        totalRewardsDistributed: ethers.formatEther(stats[1]),
        totalParentsRewarded: stats[2].toString(),
        rewardPerChild: '500 TAT',
        maxSupply: '1,000,000 TAT'
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      throw error;
    }
  }
}

module.exports = new TokenRewardService();
