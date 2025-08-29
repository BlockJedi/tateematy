const { ethers } = require('ethers');
const dotenv = require('dotenv');
const blockchainConfig = require('../config/blockchain');
dotenv.config();
const VaccinationRecords = require('../contracts/artifacts/contracts/VaccinationRecords.sol/VaccinationRecords.json');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.wallet = null;
    this.isInitialized = false;
  }

  /**
   * Initialize blockchain service
   */
  async initialize() {
    try {
      console.log('🔗 Initializing blockchain service...');
      
      // Get network configuration from config file
      const network = blockchainConfig.network;
      const rpcUrl = blockchainConfig.rpcUrl;
      const privateKey = process.env.PRIVATE_KEY;
      const contractAddress = blockchainConfig.vaccinationRecordsContract;
      
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Initialize wallet
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Initialize contract
      this.contract = new ethers.Contract(
        contractAddress,
        VaccinationRecords.abi,
        this.wallet
      );
      
      // Verify contract connection
      const code = await this.provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error('Contract not found at specified address');
      }
      
      // Get contract stats to verify connection
      const stats = await this.contract.getContractStats();
      console.log('✅ Blockchain service initialized successfully');
      console.log('📊 Contract Stats:', {
        totalRecords: stats[0].toString(),
        totalDoctors: stats[1].toString(),
      });
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      throw error;
    }
  }

  /**
   * Record a vaccination on the blockchain
   */
  async recordVaccination(vaccinationData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      console.log('📝 Recording vaccination on blockchain:', vaccinationData);
      
      // Prepare data for blockchain
      const {
        childId,
        vaccineName,
        doseNumber,
        dateGiven,
        hospitalId,
        batchNumber,
        expiryDate,
        ipfsHash = ''
      } = vaccinationData;
      
      // Convert date to timestamp if it's a Date object
      const timestamp = dateGiven instanceof Date ? Math.floor(dateGiven.getTime() / 1000) : dateGiven;
      const expiryTimestamp = expiryDate instanceof Date ? Math.floor(expiryDate.getTime() / 1000) : expiryDate;
      
      // Validate data
      if (!childId || !vaccineName || !doseNumber || !timestamp || !hospitalId || !batchNumber || !expiryTimestamp) {
        throw new Error('Missing required vaccination data for blockchain recording');
      }
      
      // Call smart contract
      const tx = await this.contract.recordVaccination(
        childId,
        vaccineName,
        doseNumber,
        timestamp,
        hospitalId,
        batchNumber,
        expiryTimestamp,
        ipfsHash
      );
      
      console.log('⏳ Transaction submitted:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('✅ Vaccination recorded on blockchain successfully');
      console.log('📊 Transaction Details:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString() || 'N/A',
        effectiveGasPrice: receipt.effectiveGasPrice ? 
          ethers.formatUnits(receipt.effectiveGasPrice, 'gwei') + ' gwei' : 'N/A'
      });
      
      // Get the record hash from the event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'VaccinationRecorded';
        } catch {
          return false;
        }
      });
      
      let recordHash = null;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        recordHash = parsed.args[0]; // recordHash is the first argument
      }
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        recordHash: recordHash,
        gasUsed: receipt.gasUsed?.toString() || 'N/A',
        effectiveGasPrice: receipt.effectiveGasPrice ? 
          ethers.formatUnits(receipt.effectiveGasPrice, 'gwei') + ' gwei' : 'N/A'
      };
      
    } catch (error) {
      console.error('❌ Failed to record vaccination on blockchain:', error.message);
      throw error;
    }
  }

  /**
   * Get vaccination record from blockchain
   */
  async getVaccinationRecord(recordHash) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      console.log('🔍 Getting vaccination record from blockchain:', recordHash);
      
      const record = await this.contract.getVaccinationRecord(recordHash);
      
      // Convert timestamp back to Date
      const dateGiven = new Date(Number(record.dateGiven) * 1000);
      const expiryDate = new Date(Number(record.expiryDate) * 1000);
      const timestamp = new Date(Number(record.timestamp) * 1000);
      
      return {
        success: true,
        data: {
          childId: record.childId,
          vaccineName: record.vaccineName,
          doseNumber: Number(record.doseNumber),
          dateGiven: dateGiven,
          doctorAddress: record.doctorAddress,
          hospitalId: record.hospitalId,
          batchNumber: record.batchNumber,
          expiryDate: expiryDate,
          timestamp: timestamp,
          isValid: record.isValid,
          ipfsHash: record.ipfsHash
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get vaccination record from blockchain:', error.message);
      throw error;
    }
  }

  /**
   * Get child's vaccination history from blockchain
   */
  async getChildVaccinationHistory(childId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      console.log('🔍 Getting vaccination history for child:', childId);
      
      const recordHashes = await this.contract.getChildVaccinationHistory(childId);
      
      // Get full records for each hash
      const records = [];
      for (const hash of recordHashes) {
        try {
          const record = await this.getVaccinationRecord(hash);
          if (record.success) {
            records.push({
              recordHash: hash,
              ...record.data
            });
          }
        } catch (recordError) {
          console.warn('⚠️ Failed to get record for hash:', hash, recordError.message);
        }
      }
      
      return {
        success: true,
        data: records
      };
      
    } catch (error) {
      console.error('❌ Failed to get child vaccination history from blockchain:', error.message);
      throw error;
    }
  }

    /**
   * Get contract statistics
   */
  async getContractStats() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const stats = await this.contract.getContractStats();
      
      // Add safety checks for null/undefined values
      const totalRecords = stats[0] !== null && stats[0] !== undefined ? Number(stats[0]) : 0;
      const contractBalance = stats[1] !== null && stats[1] !== undefined ? 
        ethers.formatEther(stats[1]) : '0.0';
      
      return {
        success: true,
        data: {
          totalRecords: totalRecords,
          contractBalance: contractBalance
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get contract stats:', error.message);
      throw error;
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      if (!this.provider) {
        await this.initialize();
      }
      
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      
      return {
        success: true,
        data: {
          chainId: Number(network.chainId),
          blockNumber: blockNumber,
          gasPrice: feeData.gasPrice ? 
            ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei' : 'N/A'
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get network info:', error.message);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized && this.contract && this.wallet;
  }

  /**
   * Get contract address
   */
  getContractAddress() {
    return this.contract ? this.contract.target : null;
  }
}

module.exports = BlockchainService;
