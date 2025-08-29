const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  // Basic Information
  // Child ID Format: CH + Parent National ID + Child Number
  // Examples: CH1234567890-001 (Parent ID 1234567890, 1st child)
  //          CH0987654321-002 (Parent ID 0987654321, 2nd child)
  //          CH000001 (Fallback generic ID if parent info unavailable)
  childId: {
    type: String,
    required: false, // Made optional so pre-save middleware can generate it
    trim: true,
    match: [/^CH\d{10}-\d{3}$|^CH[a-f0-9]{6}-\d{3}$|^CH\d{6}$/, 'Child ID must be in format CH1234567890-001, CH123456-001, or CH000000']
  },
  
  fullName: {
    type: String,
    required: [true, 'Child full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: [
      {
        validator: function(value) {
          return value <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      },
      {
        validator: function(value) {
          const today = new Date();
          const birthDate = new Date(value);
          const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                             (today.getMonth() - birthDate.getMonth());
          return ageInMonths <= 12;
        },
        message: 'Only newborns (0-12 months old) can be registered in this system'
      }
    ]
  },
  
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
  },
  
  // Medical Information
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false
  },
  
  // Parent Information
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent reference is required']
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Vaccination Tracking
  vaccinationStatus: {
    totalRequired: {
      type: Number,
      default: 12,
      min: [0, 'Total required cannot be negative']
    },
    completed: {
      type: Number,
      default: 0,
      min: [0, 'Completed cannot be negative']
    },
    nextDue: {
      type: Date,
      required: false
    },
    status: {
      type: String,
      enum: ['upcoming', 'overdue', 'completed'],
      default: 'upcoming'
    }
  },
  
  // Health Information
  allergies: [{
    name: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    notes: String
  }],
  
  medicalConditions: [{
    name: String,
    diagnosisDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    notes: String
  }],
  
  // Growth Tracking
  growthRecords: [{
    date: {
      type: Date,
      required: true
    },
    height: {
      value: Number,
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm'
      }
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg'
      }
    },
    headCircumference: {
      value: Number,
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm'
      }
    }
  }],
  
  // Blockchain Information
  blockchainId: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Notes
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
childSchema.index({ parent: 1, isActive: 1 });
childSchema.index({ childId: 1 });
childSchema.index({ 'vaccinationStatus.status': 1 });
childSchema.index({ dateOfBirth: 1 });

// Virtual for age calculation
childSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for age in months (for young children)
childSchema.virtual('ageInMonths').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  
  const yearDiff = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  return yearDiff * 12 + monthDiff;
});

// Virtual for vaccination completion percentage
childSchema.virtual('vaccinationCompletionPercentage').get(function() {
  if (this.vaccinationStatus.totalRequired === 0) return 0;
  return Math.round((this.vaccinationStatus.completed / this.vaccinationStatus.totalRequired) * 100);
});

// Pre-save middleware to generate child ID if not provided
childSchema.pre('save', async function(next) {
  if (!this.childId) {
    try {
      console.log('🔍 Pre-save middleware triggered for child:', {
        childName: this.fullName,
        parentField: this.parent,
        parentFieldType: typeof this.parent,
        parentFieldString: this.parent?.toString()
      });
      
      // Generate child ID in format: CH{ParentNationalID}-{ChildNumber}
      const existingChildrenCount = await this.constructor.countDocuments({
        parent: this.parent
      });
      
      console.log('🔍 Existing children count:', existingChildrenCount);
      
      // Get parent's national ID for the child ID with retry mechanism
      const User = require('./User');
      let parentUser = await User.findById(this.parent).select('nationalId fullName');
      
      // If national ID not available, wait a bit and retry (in case of timing issues)
      if (!parentUser?.nationalId || !/^\d{10}$/.test(parentUser.nationalId)) {
        console.log(`⏳ Parent national ID not available, waiting 100ms and retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        parentUser = await User.findById(this.parent).select('nationalId fullName');
      }
      
      if (parentUser && parentUser.nationalId && /^\d{10}$/.test(parentUser.nationalId)) {
        // Use parent's national ID for child ID
        const childNumber = String(existingChildrenCount + 1).padStart(3, '0');
        this.childId = `CH${parentUser.nationalId}-${childNumber}`;
        console.log(`✅ Generated child ID using parent national ID: ${this.childId}`);
      } else {
        // Log the issue for debugging
        console.log(`⚠️ Parent national ID not available or invalid after retry:`, {
          parentId: this.parent,
          nationalId: parentUser?.nationalId,
          hasNationalId: !!parentUser?.nationalId,
          isValidFormat: parentUser?.nationalId ? /^\d{10}$/.test(parentUser.nationalId) : false
        });
        
        // Fallback to parent ObjectId if national ID not available
        const parentIdShort = this.parent.toString().slice(-6);
        const childNumber = String(existingChildrenCount + 1).padStart(3, '0');
        this.childId = `CH${parentIdShort}-${childNumber}`;
        console.log(`⚠️ Using fallback child ID: ${this.childId}`);
      }
      
      next();
    } catch (error) {
      // Fallback to timestamp-based ID if count fails
      this.childId = `CH${Date.now().toString().slice(-6)}`;
      next();
    }
  } else {
    next();
  }
});

// Pre-save middleware to update vaccination status
childSchema.pre('save', function(next) {
  if (this.vaccinationStatus.completed >= this.vaccinationStatus.totalRequired) {
    this.vaccinationStatus.status = 'completed';
  } else if (this.vaccinationStatus.nextDue && new Date() > this.vaccinationStatus.nextDue) {
    this.vaccinationStatus.status = 'overdue';
  } else {
    this.vaccinationStatus.status = 'upcoming';
  }
  next();
});

// Instance method to add growth record
childSchema.methods.addGrowthRecord = function(growthData) {
  this.growthRecords.push(growthData);
  return this.save();
};

// Instance method to add allergy
childSchema.methods.addAllergy = function(allergyData) {
  this.allergies.push(allergyData);
  return this.save();
};

// Instance method to add medical condition
childSchema.methods.addMedicalCondition = function(conditionData) {
  this.medicalConditions.push(conditionData);
  return this.save();
};

// Static method to find children by parent
childSchema.statics.findByParent = function(parentId) {
  return this.find({ parent: parentId, isActive: true }).populate('parent', 'fullName nationalId');
};

// Static method to find children with overdue vaccinations
childSchema.statics.findOverdue = function() {
  return this.find({
    'vaccinationStatus.nextDue': { $lt: new Date() },
    'vaccinationStatus.status': { $ne: 'completed' },
    isActive: true
  });
};

// Static method to find children by parent national ID (for doctor search)
childSchema.statics.findByParentNationalId = function(parentNationalId) {
  // Support both formats: CH{NationalID}-{Number} and CH{ObjectId}-{Number}
  const searchPattern = new RegExp(`^CH${parentNationalId}-`, 'i');
  return this.find({ 
    childId: searchPattern,
    isActive: true 
  }).populate('parent', 'fullName nationalId mobile');
};

// Static method to search children by multiple criteria (for doctor search)
childSchema.statics.searchChildren = function(searchQuery) {
  const query = { isActive: true };
  
  // If search query looks like a parent national ID (10 digits), search by child ID pattern
  if (/^\d{10}$/.test(searchQuery)) {
    query.childId = new RegExp(`^CH${searchQuery}-`, 'i');
  }
  // If search query looks like a child ID, search by exact or partial match
  else if (searchQuery.startsWith('CH')) {
    query.childId = new RegExp(searchQuery, 'i');
  }
  // Otherwise, search by name
  else {
    query.fullName = new RegExp(searchQuery, 'i');
  }
  
  return this.find(query).populate('parent', 'fullName nationalId mobile');
};

// Ensure virtual fields are serialized
childSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Format date of birth for display
    if (ret.dateOfBirth) {
      ret.dateOfBirth = ret.dateOfBirth.toISOString().split('T')[0];
    }
    return ret;
  }
});

const Child = mongoose.model('Child', childSchema);

module.exports = Child;
