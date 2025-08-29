const express = require('express');
const router = express.Router();
const { verifyJWT, requireUserType } = require('../middleware/auth');
const User = require('../models/User');
const Child = require('../models/Child');
const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');

// Get system statistics
router.get('/stats', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalParents = await User.countDocuments({ userType: 'parent' });
    const totalDoctors = await User.countDocuments({ userType: 'healthcare_provider' });
    const totalChildren = await Child.countDocuments();
    const totalVaccinations = await ChildVaccinationRecord.countDocuments();
    
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalParents,
        totalDoctors,
        totalChildren,
        totalVaccinations,
        activeUsers,
        inactiveUsers
      }
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin statistics'
    });
  }
});

// Get all users with pagination and search
router.get('/users', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, userType } = req.query;
    
    let query = {};
    
    // Apply filters
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
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get users'
    });
  }
});

// Get user by ID
router.get('/users/:id', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user'
    });
  }
});

// Update user
router.put('/users/:id', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const { fullName, email, mobile, userType, isActive, profileComplete } = req.body;
    
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (userType !== undefined) updateData.userType = userType;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (profileComplete !== undefined) updateData.profileComplete = profileComplete;
    
    // Handle healthcare provider specific fields
    if (req.body.healthcareProvider) {
      updateData.healthcareProvider = req.body.healthcareProvider;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user'
    });
  }
});

// Deactivate user
router.delete('/users/:id', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate user'
    });
  }
});

// Reactivate user
router.post('/users/:id/reactivate', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reactivate user'
    });
  }
});

// Get vaccination records
router.get('/vaccination-records', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { vaccineName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await ChildVaccinationRecord.find(query)
      .populate('childId', 'fullName dateOfBirth')
      .populate('givenBy', 'fullName')
      .sort({ dateGiven: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ChildVaccinationRecord.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting vaccination records:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get vaccination records'
    });
  }
});

module.exports = router;
