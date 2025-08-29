const User = require('../models/User');
const Child = require('../models/Child');
const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');
const UserService = require('./userService');

class AdminService {
  // Get system statistics
  static async getSystemStats() {
    try {
      const userStats = await UserService.getUserStats();
      const totalChildren = await Child.countDocuments();
      const totalVaccinations = await ChildVaccinationRecord.countDocuments();
      
      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      const recentVaccinations = await ChildVaccinationRecord.countDocuments({
        dateGiven: { $gte: thirtyDaysAgo }
      });
      
      return {
        ...userStats,
        totalChildren,
        totalVaccinations,
        recentUsers,
        recentVaccinations
      };
    } catch (error) {
      throw new Error(`Failed to get system statistics: ${error.message}`);
    }
  }

  // Create healthcare provider (doctor)
  static async createHealthcareProvider(providerData) {
    try {
      // Ensure required fields are present
      const requiredFields = ['fullName', 'email', 'mobile', 'walletAddress'];
      for (const field of requiredFields) {
        if (!providerData[field]) {
          throw new Error(`${field} is required for healthcare provider`);
        }
      }
      
      // Check if wallet address already exists
      const existingUser = await UserService.walletAddressExists(providerData.walletAddress);
      if (existingUser) {
        throw new Error('Wallet address already registered');
      }
      
      // Create the healthcare provider
      const provider = new User({
        ...providerData,
        userType: 'healthcare_provider',
        profileComplete: true, // Admin-created doctors have complete profiles
        isActive: true
      });
      
      return await provider.save();
    } catch (error) {
      throw new Error(`Failed to create healthcare provider: ${error.message}`);
    }
  }

  // Update healthcare provider
  static async updateHealthcareProvider(providerId, updateData) {
    try {
      const provider = await User.findById(providerId);
      if (!provider) {
        throw new Error('Healthcare provider not found');
      }
      
      if (provider.userType !== 'healthcare_provider') {
        throw new Error('User is not a healthcare provider');
      }
      
      // Update the provider
      const updatedProvider = await User.findByIdAndUpdate(
        providerId,
        updateData,
        { new: true, runValidators: true }
      );
      
      return updatedProvider;
    } catch (error) {
      throw new Error(`Failed to update healthcare provider: ${error.message}`);
    }
  }

  // Get healthcare providers with filters
  static async getHealthcareProviders(filters = {}) {
    try {
      const { page = 1, limit = 20, search, isActive } = filters;
      
      let query = { userType: 'healthcare_provider' };
      
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'healthcareProvider.licenseNumber': { $regex: search, $options: 'i' } },
          { 'healthcareProvider.hospital': { $regex: search, $options: 'i' } }
        ];
      }
      
      if (typeof isActive === 'boolean') {
        query.isActive = isActive;
      }
      
      const skip = (page - 1) * limit;
      
      const providers = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await User.countDocuments(query);
      
      return {
        providers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get healthcare providers: ${error.message}`);
    }
  }

  // Get vaccination statistics
  static async getVaccinationStats(filters = {}) {
    try {
      const { startDate, endDate, doctorId } = filters;
      
      let query = {};
      
      if (startDate && endDate) {
        query.dateGiven = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (doctorId) {
        query.givenBy = doctorId;
      }
      
      const totalVaccinations = await ChildVaccinationRecord.countDocuments(query);
      
      // Get vaccinations by month (last 12 months)
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
          dateGiven: { $gte: monthStart, $lte: monthEnd },
          ...query
        });
        
        monthlyStats.push({
          month: monthStart.toISOString().slice(0, 7),
          count
        });
      }
      
      // Get top vaccines
      const topVaccines = await ChildVaccinationRecord.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$vaccineName',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      return {
        totalVaccinations,
        monthlyStats,
        topVaccines
      };
    } catch (error) {
      throw new Error(`Failed to get vaccination statistics: ${error.message}`);
    }
  }

  // Get system health status
  static async getSystemHealth() {
    try {
      const stats = await this.getSystemStats();
      
      // Calculate system health indicators
      const health = {
        status: 'healthy',
        issues: [],
        recommendations: []
      };
      
      // Check for inactive users
      if (stats.inactiveUsers > stats.totalUsers * 0.1) {
        health.status = 'warning';
        health.issues.push('High number of inactive users');
        health.recommendations.push('Review and clean up inactive accounts');
      }
      
      // Check for incomplete profiles
      const incompleteProfiles = stats.totalUsers - stats.activeUsers;
      if (incompleteProfiles > stats.totalUsers * 0.2) {
        health.status = 'warning';
        health.issues.push('Many users have incomplete profiles');
        health.recommendations.push('Encourage users to complete their profiles');
      }
      
      // Check for recent activity
      if (stats.recentVaccinations === 0) {
        health.status = 'warning';
        health.issues.push('No recent vaccination activity');
        health.recommendations.push('Check if vaccination recording is working properly');
      }
      
      return {
        ...stats,
        health
      };
    } catch (error) {
      throw new Error(`Failed to get system health: ${error.message}`);
    }
  }
}

module.exports = AdminService;
