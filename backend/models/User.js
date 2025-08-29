const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  // Wallet Information
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Please provide a valid Ethereum wallet address'
    }
  },
  
  // User Information
  fullName: {
    type: String,
    required: false, // Made optional for initial registration
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  
  nationalId: {
    type: String,
    required: false, // Made optional for initial registration
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty during initial registration
        return /^\d{10}$/.test(v);
      },
      message: 'National ID must be exactly 10 digits'
    }
  },
  
  mobile: {
    type: String,
    required: false, // Made optional for initial registration
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty during initial registration
        return /^(\+966|966|0)?5\d{8}$/.test(v);
      },
      message: 'Please provide a valid Saudi mobile number'
    }
  },
  
  email: {
    type: String,
    required: false, // Made optional for initial registration
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty during initial registration
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  // User Type and Role
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['parent', 'healthcare_provider', 'admin'],
    default: 'parent'
  },
  
  // Healthcare Provider Specific Fields
  healthcareProvider: {
    licenseNumber: {
      type: String,
      required: false // Made optional - admin will fill this when creating doctor
    },
    specialization: {
      type: String,
      required: false // Made optional - admin will fill this when creating doctor
    },
    hospital: {
      name: String,
      address: String,
      city: String
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Address Information
  address: {
    street: String,
    city: {
      type: String,
      enum: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Tabuk', 'Abha', 'Jizan', 'Najran', 'Hail', 'Al-Jouf', 'Al-Ahsa']
    },
    postalCode: String,
    country: {
      type: String,
      default: 'Saudi Arabia'
    }
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    mobile: String,
    email: String
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  profileComplete: {
    type: Boolean,
    default: false
  },
  
  // Security
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Blockchain Integration
  blockchainData: {
    lastSync: Date,
    transactionCount: {
      type: Number,
      default: 0
    },
    ipfsHash: String
  }
}, {
  timestamps: true
});

// Note: Indexes are defined at the bottom of the file to avoid duplicates

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.fullName || this.walletAddress.slice(0, 6) + '...' + this.walletAddress.slice(-4);
});

// Virtual for user status
userSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (!this.isVerified) return 'unverified';
  return 'active';
});

// Pre-save middleware to validate required fields when profile is being completed
userSchema.pre('save', function(next) {
  // If profile is being marked as complete, validate required fields
  if (this.profileComplete === true) {
    if (!this.fullName || this.fullName.trim().length < 2) {
      return next(new Error('Full name is required and must be at least 2 characters when completing profile'));
    }
    if (!this.nationalId || !/^\d{10}$/.test(this.nationalId)) {
      return next(new Error('Valid 10-digit National ID is required when completing profile'));
    }
    if (!this.mobile || !/^(\+966|966|0)?5\d{8}$/.test(this.mobile)) {
      return next(new Error('Valid Saudi mobile number is required when completing profile'));
    }
    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      return next(new Error('Valid email address is required when completing profile'));
    }
  }
  
  next();
});

// Pre-save middleware to normalize data
userSchema.pre('save', function(next) {
  // Normalize wallet address - always store in lowercase
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  
  // Normalize mobile number
  if (this.mobile) {
    this.mobile = this.mobile.replace(/^(\+966|966|0)/, '+966');
  }
  
  next();
});

// Pre-find middleware to normalize wallet address in queries
userSchema.pre('find', function() {
  if (this._conditions.walletAddress) {
    this._conditions.walletAddress = this._conditions.walletAddress.toLowerCase();
  }
});

userSchema.pre('findOne', function() {
  if (this._conditions.walletAddress) {
    this._conditions.walletAddress = this._conditions.walletAddress.toLowerCase();
  }
});

userSchema.pre('findOneAndUpdate', function() {
  if (this._conditions.walletAddress) {
    this._conditions.walletAddress = this._conditions.walletAddress.toLowerCase();
  }
});

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by wallet address
userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ 
    walletAddress: walletAddress.toLowerCase(),
    isActive: true 
  });
};

// Static method to find by national ID
userSchema.statics.findByNationalId = function(nationalId) {
  return this.findOne({ 
    nationalId,
    isActive: true 
  });
};

// Static method to find healthcare providers
userSchema.statics.findHealthcareProviders = function() {
  return this.find({ 
    userType: 'healthcare_provider',
    isActive: true,
    'healthcareProvider.isVerified': true
  });
};

// Static method to find parents
userSchema.statics.findParents = function() {
  return this.find({ 
    userType: 'parent',
    isActive: true 
  });
};

// Create unique indexes
userSchema.index({ walletAddress: 1 }, { unique: true });
userSchema.index({ nationalId: 1 }, { sparse: true }); // Sparse because nationalId can be null
userSchema.index({ email: 1 }, { sparse: true }); // Sparse because email can be null
userSchema.index({ mobile: 1 }, { sparse: true }); // Sparse because mobile can be null

const User = mongoose.model('User', userSchema);

module.exports = User;
