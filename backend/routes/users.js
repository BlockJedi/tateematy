const express = require('express');
const router = express.Router();
const { verifyJWT, requireUserType } = require('../middleware/auth');
const User = require('../models/User');
const Child = require('../models/Child');
const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');
const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');

// Get user profile
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    console.log('🔍 Profile request received for user:', req.user._id);
    console.log('🔍 User data:', { 
      id: req.user._id, 
      walletAddress: req.user.walletAddress, 
      userType: req.user.userType 
    });
    
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User found:', user.fullName);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', verifyJWT, async (req, res) => {
  try {
    const { fullName, email, mobile, address, userType, nationalId } = req.body;
    
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (address !== undefined) updateData.address = address;
    if (nationalId !== undefined) updateData.nationalId = nationalId;
    
    // Ensure userType is set (default to 'parent' if not provided)
    if (userType) {
      updateData.userType = userType;
    } else {
      // If userType is not provided, check if it exists in current user
      const currentUser = await User.findById(req.user._id);
      if (!currentUser.userType) {
        updateData.userType = 'parent'; // Default to parent
      }
    }
    
    // Mark profile as complete if basic fields are provided
    if (fullName && email && mobile) {
      updateData.profileComplete = true;
    }
    
    console.log('📝 Updating user profile with data:', updateData);
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log('✅ User profile updated successfully:', {
      id: user._id,
      fullName: user.fullName,
      nationalId: user.nationalId,
      profileComplete: user.profileComplete
    });
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user profile'
    });
  }
});

// Get user statistics (for parent dashboard)
router.get('/statistics', verifyJWT, requireUserType(['parent']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get children count
    const childrenCount = await Child.countDocuments({ parent: userId, isActive: true });
    
    // Get vaccination statistics
    const vaccinationStats = await ChildVaccinationStatus.aggregate([
      {
        $lookup: {
          from: 'children',
          localField: 'childId',
          foreignField: '_id',
          as: 'child'
        }
      },
      {
        $match: {
          'child.parent': userId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate statistics
    const totalVaccines = vaccinationStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedVaccines = vaccinationStats.find(stat => stat._id === 'completed')?.count || 0;
    const pendingVaccines = vaccinationStats.find(stat => stat._id === 'pending')?.count || 0;
    const overdueVaccines = vaccinationStats.find(stat => stat._id === 'overdue')?.count || 0;
    
    // Calculate school ready children (6+ years with 100% completion)
    const schoolReadyChildren = await Promise.all(
      (await Child.find({ parent: userId, isActive: true })).map(async (child) => {
        const ageInMonths = Math.floor((new Date() - new Date(child.dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44));
        if (ageInMonths >= 72) { // 6 years or older
          const CertificateService = require('../services/certificateService');
          const certService = new CertificateService();
          try {
            const schoolReadiness = await certService.checkSchoolReadinessRequirements(child._id);
            return schoolReadiness.eligible ? 1 : 0;
          } catch (error) {
            console.error(`Error checking school readiness for child ${child._id}:`, error);
            return 0;
          }
        }
        return 0;
      })
    );
    
    const schoolReadyCount = schoolReadyChildren.reduce((sum, count) => sum + count, 0);
    
    const statistics = {
      totalChildren: childrenCount,
      totalVaccinations: totalVaccines,
      completedVaccinations: completedVaccines,
      pendingVaccinations: pendingVaccines,
      overdueVaccinations: overdueVaccines,
      completionRate: totalVaccines > 0 ? Math.round((completedVaccines / totalVaccines) * 100) : 0,
      schoolReadyChildren: schoolReadyCount
    };
    
    console.log('📊 Returning statistics:', JSON.stringify(statistics, null, 2));
    
    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user statistics'
    });
  }
});

// Get user's children
router.get('/children', verifyJWT, requireUserType(['parent']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    const children = await Child.find({ parent: userId, isActive: true })
      .populate('parent', 'fullName nationalId')
      .sort({ createdAt: -1 });
    
    // Calculate real vaccination status for each child
    const childrenWithVaccinationStatus = await Promise.all(
      children.map(async (child) => {
        const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');
        
        // Get vaccination status records for this child
        const statuses = await ChildVaccinationStatus.find({ childId: child._id });
        
        // Calculate real vaccination progress
        const totalRequired = statuses.length;
        const completed = statuses.filter(s => s.status === 'completed').length;
        const pending = statuses.filter(s => s.status === 'pending').length;
        const overdue = statuses.filter(s => s.status === 'overdue').length;
        
        // Determine overall status
        let overallStatus = 'upcoming';
        if (completed === totalRequired) {
          overallStatus = 'completed';
        } else if (overdue > 0) {
          overallStatus = 'overdue';
        } else if (pending > 0) {
          overallStatus = 'pending';
        }
        
        // Get actual vaccination records for this child
        const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');
        const vaccinationRecords = await ChildVaccinationRecord.find({ 
          childId: child._id 
        }).populate('givenBy', 'fullName')
        .sort({ dateGiven: -1 });
        
        // Create child object with real vaccination status and records
        const childObj = child.toObject();
        childObj.vaccinationStatus = {
          totalRequired,
          completed,
          pending,
          overdue,
          status: overallStatus,
          nextDue: statuses.find(s => s.status === 'pending')?.scheduledDate || null
        };
        
        // Add vaccination records with formatted data
        childObj.vaccinationRecords = vaccinationRecords.map(record => ({
          _id: record._id,
          vaccineName: record.vaccineName,
          doseNumber: record.doseNumber,
          totalDoses: record.totalDoses,
          dateGiven: record.dateGiven,
          visitAge: record.visitAge,
          doctorName: record.givenBy?.fullName || 'Unknown',
          hospital: 'Unknown', // Hospital info not available in givenBy
          location: record.location || 'Unknown',
          batchNumber: record.batchNumber,
          expiryDate: record.expiryDate,
          notes: record.notes
        }));
        
        return childObj;
      })
    );
    
    res.json({
      success: true,
      data: childrenWithVaccinationStatus
    });
  } catch (error) {
    console.error('Error getting user children:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user children'
    });
  }
});

module.exports = router;
