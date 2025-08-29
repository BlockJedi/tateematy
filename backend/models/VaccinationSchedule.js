const mongoose = require('mongoose');

const vaccinationScheduleSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
vaccinationScheduleSchema.index({ ageInMonths: 1, doseNumber: 1 });
vaccinationScheduleSchema.index({ vaccineName: 1 });

// Static method to get schedule by age
vaccinationScheduleSchema.statics.getByAge = function(ageInMonths) {
  return this.find({ ageInMonths: { $lte: ageInMonths } })
    .sort({ ageInMonths: 1, doseNumber: 1 });
};

// Static method to get schedule by vaccine name
vaccinationScheduleSchema.statics.getByVaccine = function(vaccineName) {
  return this.find({ vaccineName: { $regex: vaccineName, $options: 'i' } })
    .sort({ ageInMonths: 1, doseNumber: 1 });
};

// Static method to get all required vaccines
vaccinationScheduleSchema.statics.getRequired = function() {
  return this.find({ isRequired: true })
    .sort({ ageInMonths: 1, doseNumber: 1 });
};

module.exports = mongoose.model('VaccinationSchedule', vaccinationScheduleSchema);
