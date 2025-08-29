const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');
const Child = require('../models/Child');
const User = require('../models/User');
const VaccinationSchedule = require('../models/VaccinationSchedule');
const BlockchainService = require('./blockchainService');

class VaccinationService {
  // Add a new vaccination record
  static async addVaccinationRecord(recordData) {
    try {
      console.log('📝 Adding vaccination record:', recordData);
      
      // Validate required fields
      if (!recordData.childId || !recordData.vaccineName || !recordData.doseNumber || !recordData.dateGiven || !recordData.givenBy || !recordData.location) {
        throw new Error('Missing required fields for vaccination record');
      }

      // Try to get vaccination schedule to find matching item (but don't fail if it times out)
      let visitAge = null;
      try {
        const matchingSchedule = await VaccinationSchedule.findOne({
          vaccineName: recordData.vaccineName
        }).maxTimeMS(5000); // 5 second timeout

        if (matchingSchedule) {
          visitAge = matchingSchedule.visitAge;
          console.log(`✅ Found matching schedule for ${recordData.vaccineName}: ${visitAge}`);
        }
      } catch (scheduleError) {
        console.warn(`⚠️ Could not fetch vaccination schedule for ${recordData.vaccineName}:`, scheduleError.message);
        // Continue without visitAge - it's not critical for saving the record
      }

      // Add visitAge to the record if found
      if (visitAge) {
        recordData.visitAge = visitAge;
      }

      // Create and save the vaccination record
      const record = new ChildVaccinationRecord(recordData);
      const savedRecord = await record.save();
      console.log('✅ Vaccination record saved successfully:', savedRecord._id);

      // Record vaccination on blockchain
      try {
        console.log('🔗 Recording vaccination on blockchain...');
        const blockchainService = new BlockchainService();
        
        // Prepare data for blockchain
        const blockchainData = {
          childId: recordData.childId,
          vaccineName: recordData.vaccineName,
          doseNumber: recordData.doseNumber,
          dateGiven: Math.floor(new Date(recordData.dateGiven).getTime() / 1000),
          hospitalId: recordData.location || 'Unknown',
          batchNumber: `BATCH_${Date.now()}`,
          expiryDate: Math.floor((new Date(recordData.dateGiven).getTime() + (365 * 24 * 60 * 60 * 1000)) / 1000), // 1 year from date given
          ipfsHash: '' // Can be added later if needed
        };

        // Validate that dateGiven is not in the future
        const currentTime = Math.floor(Date.now() / 1000);
        if (blockchainData.dateGiven > currentTime) {
          console.warn('⚠️ Date given is in the future, adjusting to current time');
          blockchainData.dateGiven = currentTime;
        }

        const blockchainResult = await blockchainService.recordVaccination(blockchainData);
        
        if (blockchainResult.success) {
          // Update the record with blockchain information
          await ChildVaccinationRecord.findByIdAndUpdate(savedRecord._id, {
            blockchainHash: blockchainResult.recordHash,
            blockchainTxId: blockchainResult.transactionHash,
            blockchainBlockNumber: blockchainResult.blockNumber,
            blockchainTimestamp: new Date(),
            isBlockchainRecorded: true
          });

          console.log('✅ Vaccination recorded on blockchain successfully:', {
            recordHash: blockchainResult.recordHash,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber
          });
        } else {
          console.warn('⚠️ Blockchain recording failed, but MongoDB record was saved');
        }
      } catch (blockchainError) {
        console.error('❌ Blockchain recording failed:', blockchainError.message);
        console.log('⚠️ MongoDB record saved, but blockchain recording failed');
        // Continue with the process - the main record was saved successfully
      }

      // Try to update vaccination status (but don't fail if it times out)
      try {
        const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');
        
        console.log(`🔍 Looking for vaccination status to update: ${recordData.vaccineName} (Dose ${recordData.doseNumber})`);
        
        // First, try to find the exact matching status record
        let statusUpdate = await ChildVaccinationStatus.findOneAndUpdate(
          {
            childId: recordData.childId,
            vaccineName: recordData.vaccineName,
            doseNumber: recordData.doseNumber
          },
          {
            status: 'completed',
            completedDate: recordData.dateGiven
          },
          { new: true }
        ).maxTimeMS(5000);
        
        if (statusUpdate) {
          console.log('✅ Vaccination status updated successfully for:', {
            childId: recordData.childId,
            vaccineName: recordData.vaccineName,
            doseNumber: recordData.doseNumber,
            updatedStatusId: statusUpdate._id,
            updatedStatusName: statusUpdate.vaccineName
          });
        } else {
          console.warn('⚠️ No exact matching vaccination status found to update for:', {
            childId: recordData.childId,
            vaccineName: recordData.vaccineName,
            doseNumber: recordData.doseNumber
          });
          
          // Try to find what statuses exist for this child/vaccine
          const existingStatuses = await ChildVaccinationStatus.find({
            childId: recordData.childId,
            vaccineName: recordData.vaccineName
          }).maxTimeMS(3000);
          
          console.log('🔍 Existing statuses found:', existingStatuses.length);
          existingStatuses.forEach(status => {
            console.log(`   - ${status.vaccineName} (Dose ${status.doseNumber}): ${status.status}`);
          });
          
          // If no status record exists, we might need to create one
          if (existingStatuses.length === 0) {
            console.log('⚠️ No vaccination status records found for this vaccine. This might indicate a data inconsistency.');
          }
        }
      } catch (statusError) {
        console.warn('⚠️ Could not update vaccination status:', statusError.message);
        // Continue - the main record was saved successfully
      }

      return savedRecord;
    } catch (error) {
      console.error('❌ Error adding vaccination record:', error);
      throw new Error(`Failed to add vaccination record: ${error.message}`);
    }
  }

  // Get vaccination progress for a child
  static async getVaccinationProgress(childId) {
    try {
      const child = await Child.findById(childId);
      if (!child) {
        throw new Error('Child not found');
      }

      // Get the vaccination schedule as the source of truth
      const VaccinationSchedule = require('../models/VaccinationSchedule');
      const schedule = await VaccinationSchedule.find({ isRequired: true }).sort({ ageInMonths: 1, doseNumber: 1 }).maxTimeMS(10000);
      
      // Get the child's vaccination status records
      const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');
      let statuses = await ChildVaccinationStatus.find({ childId }).sort({ ageInMonths: 1, doseNumber: 1 }).maxTimeMS(10000);
      
      // Ensure statuses is an array
      if (!Array.isArray(statuses)) {
        console.warn(`ChildVaccinationStatus.find returned non-array for childId: ${childId}`);
        statuses = [];
      }
      
      // Group by visit age using the schedule as the source of truth
      const progress = {};
      schedule.forEach(scheduleItem => {
        const ageKey = scheduleItem.visitAge;
        if (!progress[ageKey]) {
          progress[ageKey] = {
            vaccines: [],
            completed: [],
            pending: [],
            status: 'pending'
          };
        }
        
        // Add vaccine from schedule with proper dose-specific name
        progress[ageKey].vaccines.push({
          vaccineName: scheduleItem.vaccineName, // This will be "MCV4-1", "MCV4-2", etc.
          doseNumber: scheduleItem.doseNumber,
          totalDoses: scheduleItem.totalDoses,
          ageInMonths: scheduleItem.ageInMonths,
          description: scheduleItem.description
        });
        
        // Check if this vaccine is completed by looking at the status records
        const matchingStatus = statuses.find(status => 
          status.vaccineName === scheduleItem.vaccineName && 
          status.doseNumber === scheduleItem.doseNumber
        );
        
        if (matchingStatus && matchingStatus.status === 'completed') {
          progress[ageKey].completed.push(scheduleItem.vaccineName);
        } else {
          progress[ageKey].pending.push({
            vaccineName: scheduleItem.vaccineName, // Use schedule name like "MCV4-1"
            doseNumber: scheduleItem.doseNumber,
            totalDoses: scheduleItem.totalDoses,
            scheduledDate: matchingStatus?.scheduledDate || new Date(),
            status: matchingStatus?.status || 'pending',
            ageInMonths: scheduleItem.ageInMonths,
            description: scheduleItem.description
          });
        }
      });
      
      // Calculate status for each age group
      Object.keys(progress).forEach(ageKey => {
        const ageGroup = progress[ageKey];
        const totalVaccines = ageGroup.vaccines.length;
        const completedCount = ageGroup.completed.length;
        
        if (completedCount === 0) {
          ageGroup.status = 'pending';
        } else if (completedCount === totalVaccines) {
          ageGroup.status = 'completed';
        } else {
          ageGroup.status = 'partial';
        }
      });

      // Add child age information
      const childAgeInMonths = Math.floor((new Date() - new Date(child.dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44));
      
      return {
        ageInMonths: childAgeInMonths,
        progress: progress
      };
    } catch (error) {
      console.error('Error getting vaccination progress:', error);
      throw error;
    }
  }

  // Get upcoming vaccines for a child
  static async getUpcomingVaccines(childId) {
    try {
      const progress = await this.getVaccinationProgress(childId);
      const upcoming = [];
      
      Object.keys(progress.progress).forEach(ageKey => {
        const ageGroup = progress.progress[ageKey];
        if (ageGroup.status === 'pending' && ageGroup.pending.length > 0) {
          upcoming.push(...ageGroup.pending);
        }
      });
      
      return upcoming;
    } catch (error) {
      console.error('Error getting upcoming vaccines:', error);
      throw error;
    }
  }

  // Get overdue vaccines for a child
  static async getOverdueVaccines(childId) {
    try {
      const progress = await this.getVaccinationProgress(childId);
      const overdue = [];
      
      Object.keys(progress.progress).forEach(ageKey => {
        const ageGroup = progress.progress[ageKey];
        if (ageGroup.status === 'pending' && ageGroup.pending.length > 0) {
          ageGroup.pending.forEach(vaccine => {
            if (vaccine.ageInMonths < progress.ageInMonths) {
              overdue.push(vaccine);
            }
          });
        }
      });
      
      return overdue;
    } catch (error) {
      console.error('Error getting overdue vaccines:', error);
      throw error;
    }
  }

  // Get vaccination history for a child
  static async getVaccinationHistory(childId) {
    try {
      const records = await ChildVaccinationRecord.find({ childId })
        .sort({ dateGiven: -1 })
        .populate('givenBy', 'fullName')
        .maxTimeMS(10000);
      
      return records;
    } catch (error) {
      console.error('Error getting vaccination history:', error);
      throw error;
    }
  }

  // Get vaccination statistics for a child
  static async getVaccinationStats(childId) {
    try {
      const totalRecords = await ChildVaccinationRecord.countDocuments({ childId }).maxTimeMS(5000);
      const progress = await this.getVaccinationProgress(childId);
      
      let totalVaccines = 0;
      let completedVaccines = 0;
      
      Object.keys(progress.progress).forEach(ageKey => {
        const ageGroup = progress.progress[ageKey];
        totalVaccines += ageGroup.vaccines.length;
        completedVaccines += ageGroup.completed.length;
      });
      
      return {
        totalRecords,
        totalVaccines,
        completedVaccines,
        completionRate: totalVaccines > 0 ? Math.round((completedVaccines / totalVaccines) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting vaccination stats:', error);
      throw error;
    }
  }

  // Sync vaccination status for a child (useful for fixing data inconsistencies)
  static async syncVaccinationStatus(childId) {
    try {
      console.log(`🔄 Syncing vaccination status for child: ${childId}`);
      
      // Get all vaccination records for this child
      const records = await ChildVaccinationRecord.find({ childId }).maxTimeMS(10000);
      console.log(`📋 Found ${records.length} vaccination records`);
      
      // Get vaccination statuses
      const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');
      const statuses = await ChildVaccinationStatus.find({ childId }).maxTimeMS(10000);
      console.log(`📊 Found ${statuses.length} vaccination statuses`);
      
      let updatedCount = 0;
      
      // For each vaccination record, ensure the status is marked as completed
      for (const record of records) {
        const existingStatus = statuses.find(status => 
          status.vaccineName === record.vaccineName && 
          status.doseNumber === record.doseNumber
        );
        
        if (existingStatus && existingStatus.status !== 'completed') {
          // Update status to completed
          await ChildVaccinationStatus.findByIdAndUpdate(existingStatus._id, {
            status: 'completed',
            completedDate: record.dateGiven
          });
          updatedCount++;
          console.log(`✅ Updated status for ${record.vaccineName} Dose ${record.doseNumber}`);
        } else if (!existingStatus) {
          console.log(`⚠️ No status record found for ${record.vaccineName} Dose ${record.doseNumber}`);
        }
      }
      
      console.log(`🎉 Sync completed. Updated ${updatedCount} statuses.`);
      return { updatedCount, totalRecords: records.length };
      
    } catch (error) {
      console.error('❌ Error syncing vaccination status:', error);
      throw error;
    }
  }
}

module.exports = VaccinationService;

