const express = require('express');
const router = express.Router();
const { verifyJWT, requireUserType } = require('../middleware/auth');
const tokenRewardService = require('../services/tokenRewardService');

// Get token reward eligibility for a child
router.get('/eligibility/:childId', 
  verifyJWT, 
  requireUserType(['parent']), 
  async (req, res) => {
    try {
      const { childId } = req.params;
      const userId = req.user._id;
      
      // Check if user owns this child
      const Child = require('../models/Child');
      const child = await Child.findOne({ _id: childId, parent: userId });
      
      if (!child) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this child'
        });
      }

      const eligibility = await tokenRewardService.checkEligibility(childId);
      
      res.json({
        success: true,
        data: eligibility
      });
    } catch (error) {
      console.error('Error checking token eligibility:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check token eligibility'
      });
    }
  }
);

// Claim tokens for vaccination completion
router.post('/claim/:childId', 
  verifyJWT, 
  requireUserType(['parent']), 
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { walletAddress } = req.body;
      const userId = req.user._id;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid wallet address format'
        });
      }

      // Check if user owns this child
      const Child = require('../models/Child');
      const child = await Child.findOne({ _id: childId, parent: userId });
      
      if (!child) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this child'
        });
      }

      // Award tokens
      const result = await tokenRewardService.awardTokens(childId, walletAddress);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error claiming tokens:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to claim tokens'
      });
    }
  }
);

// Get parent's token information
router.get('/parent-info', 
  verifyJWT, 
  requireUserType(['parent']), 
  async (req, res) => {
    try {
      const { walletAddress } = req.query;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
      }

      const parentInfo = await tokenRewardService.getParentTokenInfo(walletAddress);
      
      res.json({
        success: true,
        data: parentInfo
      });
    } catch (error) {
      console.error('Error getting parent token info:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get parent token info'
      });
    }
  }
);

// Get child's claim information
router.get('/child-claim/:childId', 
  verifyJWT, 
  requireUserType(['parent']), 
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { walletAddress } = req.query;
      const userId = req.user._id;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
      }

      // Check if user owns this child
      const Child = require('../models/Child');
      const child = await Child.findOne({ _id: childId, parent: userId });
      
      if (!child) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this child'
        });
      }

      const claimInfo = await tokenRewardService.getChildClaimInfo(childId, walletAddress);
      
      res.json({
        success: true,
        data: claimInfo
      });
    } catch (error) {
      console.error('Error getting child claim info:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get child claim info'
      });
    }
  }
);

// Get contract statistics (public)
router.get('/contract-stats', async (req, res) => {
  try {
    const stats = await tokenRewardService.getContractStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting contract stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get contract stats'
    });
  }
});

// Get reward calculation for a child
router.get('/reward-calculation/:childId', 
  verifyJWT, 
  requireUserType(['parent']), 
  async (req, res) => {
    try {
      const { childId } = req.params;
      const userId = req.user._id;
      
      // Check if user owns this child
      const Child = require('../models/Child');
      const child = await Child.findOne({ _id: childId, parent: userId });
      
      if (!child) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this child'
        });
      }

      const eligibility = await tokenRewardService.checkEligibility(childId);
      const reward = tokenRewardService.calculateReward(
        eligibility.completedCount, 
        eligibility.isFullScheduleCompleted
      );
      
      res.json({
        success: true,
        data: {
          eligibility,
          reward,
          childInfo: {
            name: child.fullName,
            ageInMonths: Math.floor((new Date() - new Date(child.dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44))
          }
        }
      });
    } catch (error) {
      console.error('Error calculating reward:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate reward'
      });
    }
  }
);

module.exports = router;
