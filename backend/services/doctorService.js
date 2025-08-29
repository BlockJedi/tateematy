const User = require('../models/User');
const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');

class DoctorService {
  /**
   * Get doctor by ID
   */
  static async getById(doctorId) {
    try {
      const doctor = await User.findById(doctorId)
        .select('-password')
        .populate('healthcareProvider');
      
      if (!doctor || doctor.userType !== 'healthcare_provider') {
        throw new Error('Doctor not found');
      }
      
      return doctor;
    } catch (error) {
      throw new Error(`Failed to get doctor: ${error.message}`);
    }
  }

  /**
   * Get doctor statistics
   */
  static async getStats(doctorId) {
    try {
      // Verify doctor exists
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.userType !== 'healthcare_provider') {
        throw new Error('Doctor not found');
      }

      // Get vaccination statistics
      const totalVaccinations = await ChildVaccinationRecord.countDocuments({ givenBy: doctorId });
      
      // Get vaccinations by month (last 12 months)
      const monthlyStats = await this.getMonthlyStats(doctorId);
      
      // Get top vaccines administered
      const topVaccines = await this.getTopVaccines(doctorId);
      
      // Get recent vaccinations
      const recentVaccinations = await this.getRecentVaccinations(doctorId);
      
      return {
        totalVaccinations,
        monthlyStats,
        topVaccines,
        recentVaccinations
      };
    } catch (error) {
      throw new Error(`Failed to get doctor stats: ${error.message}`);
    }
  }

  /**
   * Get monthly vaccination statistics
   */
  static async getMonthlyStats(doctorId) {
    const monthlyStats = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const count = await ChildVaccinationRecord.countDocuments({
        givenBy: doctorId,
        dateGiven: { $gte: monthStart, $lte: monthEnd }
      });
      
      monthlyStats.push({
        month: monthStart.toISOString().slice(0, 7),
        count
      });
    }
    
    return monthlyStats;
  }

  /**
   * Get top vaccines administered by doctor
   */
  static async getTopVaccines(doctorId) {
    return await ChildVaccinationRecord.aggregate([
      { $match: { givenBy: doctorId } },
      {
        $group: {
          _id: '$vaccineName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
  }

  /**
   * Get recent vaccinations by doctor
   */
  static async getRecentVaccinations(doctorId, limit = 5) {
    return await ChildVaccinationRecord.find({ givenBy: doctorId })
      .populate('childId', 'fullName dateOfBirth')
      .sort({ dateGiven: -1 })
      .limit(limit);
  }

  /**
   * Get doctor's vaccination history with pagination
   */
  static async getVaccinationHistory(doctorId, options = {}) {
    try {
      const { page = 1, limit = 20, startDate, endDate } = options;
      
      // Verify doctor exists
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.userType !== 'healthcare_provider') {
        throw new Error('Doctor not found');
      }
      
      let query = { givenBy: doctorId };
      
      // Add date filters if provided
      if (startDate && endDate) {
        query.dateGiven = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const vaccinations = await ChildVaccinationRecord.find(query)
        .populate('childId', 'fullName dateOfBirth')
        .sort({ dateGiven: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await ChildVaccinationRecord.countDocuments(query);
      
      return {
        vaccinations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      throw new Error(`Failed to get vaccination history: ${error.message}`);
    }
  }

  /**
   * Update doctor profile
   */
  static async updateProfile(doctorId, updateData, currentUser) {
    try {
      // Verify the doctor exists
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.userType !== 'healthcare_provider') {
        throw new Error('Doctor not found');
      }
      
      // Only allow doctors to update their own profile, or admins to update any
      if (currentUser.userType === 'healthcare_provider' && currentUser._id.toString() !== doctorId) {
        throw new Error('You can only update your own profile');
      }
      
      const { fullName, email, mobile, healthcareProvider } = updateData;
      
      const updateFields = {};
      if (fullName !== undefined) updateFields.fullName = fullName;
      if (email !== undefined) updateFields.email = email;
      if (mobile !== undefined) updateFields.mobile = mobile;
      if (healthcareProvider !== undefined) updateFields.healthcareProvider = healthcareProvider;
      
      const updatedDoctor = await User.findByIdAndUpdate(
        doctorId,
        updateFields,
        { new: true, runValidators: true }
      ).select('-password');
      
      return updatedDoctor;
    } catch (error) {
      throw new Error(`Failed to update doctor profile: ${error.message}`);
    }
  }

  /**
   * Get all doctors (for admin)
   */
  static async getAllDoctors(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, search, specialization } = pagination;
      
      let query = { userType: 'healthcare_provider' };
      
      // Add search filter
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'healthcareProvider.specialization': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Add specialization filter
      if (specialization) {
        query['healthcareProvider.specialization'] = { $regex: specialization, $options: 'i' };
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const doctors = await User.find(query)
        .select('fullName email mobile healthcareProvider createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await User.countDocuments(query);
      
      return {
        doctors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      throw new Error(`Failed to get all doctors: ${error.message}`);
    }
  }

  /**
   * Get doctor performance metrics
   */
  static async getPerformanceMetrics(doctorId, period = 'month') {
    try {
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.userType !== 'healthcare_provider') {
        throw new Error('Doctor not found');
      }

      let startDate, endDate;
      const now = new Date();
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      endDate = new Date(now);
      
      const vaccinations = await ChildVaccinationRecord.countDocuments({
        givenBy: doctorId,
        dateGiven: { $gte: startDate, $lte: endDate }
      });
      
      const uniqueChildren = await ChildVaccinationRecord.distinct('childId', {
        givenBy: doctorId,
        dateGiven: { $gte: startDate, $lte: endDate }
      });
      
      return {
        period,
        startDate,
        endDate,
        totalVaccinations: vaccinations,
        uniqueChildren: uniqueChildren.length,
        averageVaccinationsPerChild: uniqueChildren.length > 0 ? (vaccinations / uniqueChildren.length).toFixed(2) : 0
      };
    } catch (error) {
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }
}

module.exports = DoctorService;
