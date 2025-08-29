const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  // Certificate Information
  certificateId: {
    type: String,
    required: false, // Optional for progress certificates
    unique: true,
    sparse: true, // Allows multiple null values
    // Format: CERT-{ChildID}-{Type}-{Timestamp}
    // Example: CERT-CH1234567890-001-school_readiness-20241201
  },
  
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  
  certificateType: {
    type: String,
    required: true,
    enum: ['school_readiness', 'completion', 'progress']
  },
  
  // Certificate Status
  status: {
    type: String,
    required: true,
    enum: ['generated', 'uploaded_to_ipfs', 'stored_on_blockchain', 'verified'],
    default: 'generated'
  },
  
  // File Information
  fileName: {
    type: String,
    required: false // Make optional since we generate it dynamically
  },
  
  fileSize: {
    type: Number,
    required: false // Make optional since we might not always have it
  },
  
  mimeType: {
    type: String,
    required: true,
    default: 'image/png'
  },
  
  // IPFS Information (for blockchain certificates)
  ipfsHash: {
    type: String,
    sparse: true // Can be null for progress certificates
  },
  
  ipfsUrl: {
    type: String,
    sparse: true // Can be null for progress certificates
  },
  
  ipfsGateway: {
    type: String,
    default: 'https://ipfs.io/ipfs/'
  },
  
  // Blockchain Information (for blockchain certificates)
  blockchainTx: {
    type: String,
    sparse: true // Can be null for progress certificates
  },
  
  blockchainNetwork: {
    type: String,
    default: 'holesky'
  },
  
  blockNumber: {
    type: Number,
    sparse: true
  },
  
  // Verification Information
  verified: {
    type: Boolean,
    required: true,
    default: false
  },
  
  verifiedAt: {
    type: Date,
    sparse: true
  },
  
  verificationData: {
    verifiedBy: String,
    verificationMethod: String,
    verificationNotes: String
  },
  
  // Certificate Content (for regeneration if needed)
  certificateData: {
    title: String,
    subtitle: String,
    childName: String,
    childId: String,
    dateOfBirth: Date,
    gender: String,
    issuedDate: Date,
    validity: String,
    purpose: String,
    requirements: mongoose.Schema.Types.Mixed
  },
  
  // Access Control
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional since we don't always have user context
  },
  
  // Metadata
  tags: [String], // For search and categorization
  notes: String,
  
  // Expiry and Renewal
  expiresAt: {
    type: Date,
    sparse: true
  },
  
  canRenew: {
    type: Boolean,
    default: false
  },
  
  // Download and Usage Tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  
  lastDownloaded: {
    type: Date,
    sparse: true
  },
  
  // QR Code Information
  qrCodeData: {
    type: String,
    sparse: true
  },
  
  qrCodeImage: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
certificateSchema.index({ childId: 1, certificateType: 1 });
certificateSchema.index({ certificateType: 1, status: 1 });

certificateSchema.index({ verified: 1 });
certificateSchema.index({ createdAt: -1 });

// Virtual for full IPFS URL (fallback)
certificateSchema.virtual('fullIpfsUrl').get(function() {
  // If we have a stored IPFS URL, use it (this will be the Pinata gateway URL)
  if (this.ipfsUrl) {
    return this.ipfsUrl;
  }
  // Fallback to constructing from gateway + hash
  if (this.ipfsHash) {
    return `${this.ipfsGateway}${this.ipfsHash}`;
  }
  return null;
});

// Virtual for blockchain explorer URL
certificateSchema.virtual('blockchainUrl').get(function() {
  if (this.blockchainTx) {
    switch (this.blockchainNetwork) {
      case 'holesky':
        return `https://holesky.etherscan.io/tx/${this.blockchainTx}`;
      case 'mainnet':
        return `https://etherscan.io/tx/${this.blockchainTx}`;
      default:
        return `https://etherscan.io/tx/${this.blockchainTx}`;
    }
  }
  return null;
});

// Virtual for certificate display name
certificateSchema.virtual('displayName').get(function() {
  const typeNames = {
    'school_readiness': 'School Readiness',
    'completion': 'Complete Vaccination',
    'progress': 'Current Progress'
  };
  return `${typeNames[this.certificateType]} Certificate`;
});

// Pre-save middleware to generate certificate ID only for blockchain certificates
certificateSchema.pre('save', function(next) {
  // Only generate certificate ID for blockchain certificates
  if (!this.certificateId && (this.certificateType === 'school_readiness' || this.certificateType === 'completion')) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const childId = this.childId.toString().slice(-6);
    this.certificateId = `CERT-${childId}-${this.certificateType}-${timestamp}`;
  }
  next();
});

// Static method to find certificates by child
certificateSchema.statics.findByChild = function(childId) {
  return this.find({ childId }).sort({ createdAt: -1 });
};

// Static method to find certificates by type
certificateSchema.statics.findByType = function(certificateType) {
  return this.find({ certificateType }).sort({ createdAt: -1 });
};

// Static method to find verified certificates
certificateSchema.statics.findVerified = function() {
  return this.find({ verified: true }).sort({ createdAt: -1 });
};

// Static method to find blockchain certificates
certificateSchema.statics.findBlockchainCertificates = function() {
  return this.find({ 
    $or: [
      { certificateType: 'school_readiness' },
      { certificateType: 'completion' }
    ],
    ipfsHash: { $exists: true },
    blockchainTx: { $exists: true }
  }).sort({ createdAt: -1 });
};

// Instance method to increment download count
certificateSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Instance method to mark as verified
certificateSchema.methods.markAsVerified = function(verificationData) {
  this.verified = true;
  this.verifiedAt = new Date();
  this.verificationData = verificationData;
  this.status = 'verified';
  return this.save();
};

// Instance method to update IPFS information
certificateSchema.methods.updateIPFSInfo = function(ipfsHash, fileSize) {
  this.ipfsHash = ipfsHash;
  this.fileSize = fileSize;
  this.status = 'uploaded_to_ipfs';
  return this.save();
};

// Instance method to update blockchain information
certificateSchema.methods.updateBlockchainInfo = function(blockchainTx, blockNumber) {
  this.blockchainTx = blockchainTx;
  this.blockNumber = blockNumber;
  this.status = 'stored_on_blockchain';
  return this.save();
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
