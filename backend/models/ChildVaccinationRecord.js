const mongoose = require('mongoose');

const childVaccinationRecordSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  vaccineName: {
    type: String,
    required: true,
    trim: true
  },
  doseNumber: {
    type: Number,
    required: true,
    min: 1
  },
  visitAge: {
    type: String,
    trim: true
  },
  dateGiven: {
    type: Date,
    required: true
  },
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Blockchain integration fields
  blockchainHash: {
    type: String,
    trim: true,
    default: null
  },
  blockchainTxId: {
    type: String,
    trim: true,
    default: null
  },
  blockchainBlockNumber: {
    type: Number,
    default: null
  },
  blockchainTimestamp: {
    type: Date,
    default: null
  },
  isBlockchainRecorded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
childVaccinationRecordSchema.index({ childId: 1, vaccineName: 1, doseNumber: 1 });
childVaccinationRecordSchema.index({ childId: 1, dateGiven: -1 });

// Virtual for age group calculation
childVaccinationRecordSchema.virtual('ageGroup').get(function() {
  const child = this.model('Child').findById(this.childId);
  if (!child) return null;
  
  const ageInMonths = Math.floor((Date.now() - child.dateOfBirth) / (1000 * 60 * 60 * 24 * 30));
  
  if (ageInMonths < 2) return 'At Birth';
  if (ageInMonths < 4) return '2 Months';
  if (ageInMonths < 6) return '4 Months';
  if (ageInMonths < 9) return '6 Months';
  if (ageInMonths < 12) return '9 Months';
  if (ageInMonths < 18) return '12 Months';
  if (ageInMonths < 24) return '18 Months';
  if (ageInMonths < 48) return '24 Months';
  if (ageInMonths < 72) return '4-6 Years';
  if (ageInMonths < 132) return '11 Years';
  if (ageInMonths < 144) return '12 Years';
  return '18 Years';
});

// Static method to get vaccination progress for a child
childVaccinationRecordSchema.statics.getVaccinationProgress = async function(childId) {
  try {
    const records = await this.find({ childId }).sort({ dateGiven: 1 });
    
    // Get the child to calculate age
    const child = await mongoose.model('Child').findById(childId);
    if (!child) {
      throw new Error('Child not found');
    }
    
    // Get the vaccination schedule to compare against
    const schedule = await mongoose.model('VaccinationSchedule').find().sort({ ageInMonths: 1 });
    
    const progress = {};
    
    // Group vaccines by age and count total vaccines per age group
    schedule.forEach(ageGroup => {
      const ageKey = ageGroup.visitAge;
      if (!progress[ageKey]) {
        progress[ageKey] = {
          vaccines: [],
          completed: [],
          pending: [],
          status: 'pending' // pending, partial, completed
        };
      }
      // Add this vaccine to the age group
      progress[ageKey].vaccines.push({
        vaccineName: ageGroup.vaccineName,
        doseNumber: ageGroup.doseNumber,
        totalDoses: ageGroup.totalDoses
      });
    });
    
    // Mark completed vaccines
    records.forEach(record => {
      // Calculate age group for this record based on when it was given
      const ageInMonths = Math.floor((record.dateGiven - child.dateOfBirth) / (1000 * 60 * 60 * 24 * 30));
      
      let ageKey = 'At Birth';
      if (ageInMonths >= 2 && ageInMonths < 4) ageKey = '2 Months';
      else if (ageInMonths >= 4 && ageInMonths < 6) ageKey = '4 Months';
      else if (ageInMonths >= 6 && ageInMonths < 9) ageKey = '6 Months';
      else if (ageInMonths >= 9 && ageInMonths < 12) ageKey = '9 Months';
      else if (ageInMonths >= 12 && ageInMonths < 18) ageKey = '12 Months';
      else if (ageInMonths >= 18 && ageInMonths < 24) ageKey = '18 Months';
      else if (ageInMonths >= 24 && ageInMonths < 48) ageKey = '24 Months';
      else if (ageInMonths >= 48 && ageInMonths < 72) ageKey = '4-6 Years';
      else if (ageInMonths >= 72 && ageInMonths < 132) ageKey = '11 Years';
      else if (ageInMonths >= 132 && ageInMonths < 144) ageKey = '12 Years';
      else if (ageInMonths >= 144) ageKey = '18 Years';
      
      if (progress[ageKey]) {
        // Store vaccine name with dose number for proper medical tracking
        const vaccineKey = `${record.vaccineName}-${record.doseNumber}`;
        if (!progress[ageKey].completed.includes(vaccineKey)) {
          progress[ageKey].completed.push(vaccineKey);
        }
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
      
      // Calculate pending vaccines - match by vaccine name and dose number
      ageGroup.pending = ageGroup.vaccines.filter(vaccine => {
        const vaccineKey = `${vaccine.vaccineName}-${vaccine.doseNumber}`;
        return !ageGroup.completed.includes(vaccineKey);
      });
    });
    
    return progress;
  } catch (error) {
    console.error('Error in getVaccinationProgress:', error);
    throw error;
  }
};

// Static method to check if child is ready for school (age 6+)
childVaccinationRecordSchema.statics.isSchoolReady = async function(childId) {
  try {
    const progress = await this.getVaccinationProgress(childId);
    
    // Required age groups for school (birth to 6 years)
    const requiredAgeGroups = ['At Birth', '2 Months', '4 Months', '6 Months', '9 Months', '12 Months', '18 Months', '24 Months', '4-6 Years'];
    
    return requiredAgeGroups.every(ageKey => 
      progress[ageKey] && progress[ageKey].status === 'completed'
    );
  } catch (error) {
    console.error('Error in isSchoolReady:', error);
    return false;
  }
};

module.exports = mongoose.model('ChildVaccinationRecord', childVaccinationRecordSchema);
