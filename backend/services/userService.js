const User = require('../models/User');

class UserService {
  // Get user by wallet address
  static async getByWalletAddress(walletAddress) {
    try {
      return await User.findOne({ 
        walletAddress: walletAddress.toLowerCase() 
      });
    } catch (error) {
      throw new Error(`Failed to get user by wallet address: ${error.message}`);
    }
  }

  // Get user by ID
  static async getById(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }
  }

  // Create new user
  static async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Update user
  static async updateUser(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Get users by type
  static async getByUserType(userType, options = {}) {
    try {
      const { page = 1, limit = 20, search } = options;
      
      let query = { userType };
      
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { walletAddress: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await User.countDocuments(query);
      
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get users by type: ${error.message}`);
    }
  }

  // Get all users with filters
  static async getAllUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, search, userType, isActive } = filters;
      
      let query = {};
      
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { walletAddress: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (userType) {
        query.userType = userType;
      }
      
      if (typeof isActive === 'boolean') {
        query.isActive = isActive;
      }
      
      const skip = (page - 1) * limit;
      
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await User.countDocuments(query);
      
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get all users: ${error.message}`);
    }
  }

  // Deactivate user
  static async deactivateUser(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  }

  // Reactivate user
  static async reactivateUser(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isActive: true },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to reactivate user: ${error.message}`);
    }
  }

  // Check if wallet address exists
  static async walletAddressExists(walletAddress) {
    try {
      const user = await User.findOne({ 
        walletAddress: walletAddress.toLowerCase() 
      });
      return !!user;
    } catch (error) {
      throw new Error(`Failed to check wallet address: ${error.message}`);
    }
  }

  // Get user statistics
  static async getUserStats() {
    try {
      const totalUsers = await User.countDocuments();
      const totalParents = await User.countDocuments({ userType: 'parent' });
      const totalDoctors = await User.countDocuments({ userType: 'healthcare_provider' });
      const totalAdmins = await User.countDocuments({ userType: 'admin' });
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });
      
      return {
        totalUsers,
        totalParents,
        totalDoctors,
        totalAdmins,
        activeUsers,
        inactiveUsers
      };
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }
}

module.exports = UserService;
