const mongoose = require('mongoose');

const childVaccinationStatusSchema = new mongoose.Schema({
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
  visitAge: {
    type: String,
    required: true,
    trim: true
  },
  ageInMonths: {
    type: Number,
    required: true,
    min: 0
  },
  doseNumber: {
    type: Number,
    required: true,
    min: 1
  },
  totalDoses: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'overdue', 'skipped'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
childVaccinationStatusSchema.index({ childId: 1, vaccineName: 1 });
childVaccinationStatusSchema.index({ childId: 1, status: 1 });
childVaccinationStatusSchema.index({ scheduledDate: 1 });

// Static method to get vaccination status for a child
childVaccinationStatusSchema.statics.getByChild = function(childId) {
  return this.find({ childId })
    .sort({ ageInMonths: 1, doseNumber: 1 });
};

// Static method to get pending vaccinations for a child
childVaccinationStatusSchema.statics.getPending = function(childId) {
  return this.find({ 
    childId, 
    status: { $in: ['pending', 'overdue'] } 
  }).sort({ scheduledDate: 1 });
};

// Static method to get completed vaccinations for a child
childVaccinationStatusSchema.statics.getCompleted = function(childId) {
  return this.find({ 
    childId, 
    status: 'completed' 
  }).sort({ completedDate: -1 });
};

module.exports = mongoose.model('ChildVaccinationStatus', childVaccinationStatusSchema);
