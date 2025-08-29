const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const VaccinationService = require('../services/vaccinationService');
const { verifyJWT, requireUserType } = require('../middleware/auth');

// Test route to debug
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Vaccination routes are working!' });
});

// Root route to show available endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Vaccination API is working',
    availableEndpoints: {
      'POST /': 'Add new vaccination record (doctors only)',
      'GET /progress/:childId': 'Get vaccination progress for a child',
      'GET /upcoming/:childId': 'Get upcoming vaccines for a child',
      'GET /overdue/:childId': 'Get overdue vaccines for a child',
      'GET /history/:childId': 'Get vaccination history for a child',
      'GET /stats/:childId': 'Get vaccination statistics for a child',
      'GET /certificate/eligibility/:childId': 'Check certificate eligibility',
      'POST /sync-status/:childId': 'Sync vaccination records with status (for fixing existing data)'
    }
  });
});

// Validation middleware
const validateVaccinationRecord = [
  body('childId').isMongoId().withMessage('Valid child ID is required'),
  body('vaccineName').custom((value) => {
    // Check if vaccine name starts with a valid base vaccine name
    const validBaseVaccines = [
      'IPV', 'DTaP', 'Hepatitis B', 'Hib', 'PCV', 'Rotavirus', 
      'OPV', 'BCG', 'Measles', 'MCV4', 'MMR', 'Varicella', 
      'Hepatitis A', 'HPV'
    ];
    
    // Check if it's a valid base vaccine name
    if (validBaseVaccines.includes(value)) {
      return true;
    }
    
    // Check if it's a valid vaccine name with dose number (e.g., MCV4-1, DTaP-2)
    const baseVaccine = value.replace(/-\d+$/, '');
    if (validBaseVaccines.includes(baseVaccine)) {
      return true;
    }
    
    throw new Error('Valid vaccine name is required');
  }).withMessage('Valid vaccine name is required'),
  body('doseNumber').isInt({ min: 1 }).withMessage('Dose number must be at least 1'),
  body('dateGiven').isISO8601().withMessage('Valid date is required'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('notes').optional().trim()
];

// Add new vaccination record (doctors only)
router.post('/', 
  verifyJWT, 
  requireUserType(['healthcare_provider', 'admin']),
  validateVaccinationRecord,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const recordData = {
        ...req.body,
        givenBy: req.user._id
      };

      const record = await VaccinationService.addVaccinationRecord(recordData);
      
      res.status(201).json({
        success: true,
        message: 'Vaccination record added successfully',
        data: record
      });
    } catch (error) {
      console.error('Error adding vaccination record:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add vaccination record'
      });
    }
  }
);

// Get vaccination progress for a child
router.get('/progress/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check if user has access to this child
      if (req.user.userType === 'parent') {
        // Parents can only see their own children
        const Child = require('../models/Child');
        const child = await Child.findOne({ _id: childId, parent: req.user._id });
        if (!child) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this child'
          });
        }
      }

      const progress = await VaccinationService.getVaccinationProgress(childId);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error getting vaccination progress:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get vaccination progress'
      });
    }
  }
);

// Get upcoming vaccines for a child
router.get('/upcoming/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check access permissions
      if (req.user.userType === 'parent') {
        const Child = require('../models/Child');
        const child = await Child.findOne({ _id: childId, parent: req.user._id });
        if (!child) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this child'
          });
        }
      }

      const upcoming = await VaccinationService.getUpcomingVaccines(childId);
      
      res.json({
        success: true,
        data: upcoming
      });
    } catch (error) {
      console.error('Error getting upcoming vaccines:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get upcoming vaccines'
      });
    }
  }
);

// Get overdue vaccines for a child
router.get('/overdue/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check access permissions
      if (req.user.userType === 'parent') {
        const Child = require('../models/Child');
        const child = await Child.findOne({ _id: childId, parent: req.user._id });
        if (!child) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this child'
          });
        }
      }

      const overdue = await VaccinationService.getOverdueVaccines(childId);
      
      res.json({
        success: true,
        data: overdue
      });
    } catch (error) {
      console.error('Error getting overdue vaccines:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get overdue vaccines'
      });
    }
  }
);

// Get vaccination history for a child
router.get('/history/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check access permissions
      if (req.user.userType === 'parent') {
        const Child = require('../models/Child');
        const child = await Child.findOne({ _id: childId, parent: req.user._id });
        if (!child) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this child'
          });
        }
      }

      const history = await VaccinationService.getVaccinationHistory(childId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting vaccination history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get vaccination history'
      });
    }
  }
);

// Get vaccination statistics for a child
router.get('/stats/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check access permissions
      if (req.user.userType === 'parent') {
        const Child = require('../models/Child');
        const child = await Child.findOne({ _id: childId, parent: req.user._id });
        if (!child) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this child'
          });
        }
      }

      const stats = await VaccinationService.getVaccinationStats(childId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting vaccination stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get vaccination stats'
      });
    }
  }
);

// Check if child is eligible for age 6 certificate
router.get('/certificate/eligibility/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check access permissions
      if (req.user.userType === 'parent') {
        const Child = require('../models/Child');
        const child = await Child.findOne({ _id: childId, parent: req.user._id });
        if (!child) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this child'
          });
        }
      }

      const eligible = await VaccinationService.isEligibleForAge6Certificate(childId);
      
      res.json({
        success: true,
        data: { eligible }
      });
    } catch (error) {
      console.error('Error checking certificate eligibility:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check certificate eligibility'
      });
    }
  }
);

// Get vaccination history by doctor
router.get('/doctor/:doctorId/history', 
  verifyJWT, 
  requireUserType(['healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { doctorId } = req.params;
      
      // Check if the requesting user is the same doctor or an admin
      if (req.user.userType === 'healthcare_provider' && req.user._id.toString() !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own vaccination records.'
        });
      }

      const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');
      const Child = require('../models/Child');
      
      // Get vaccination records given by this doctor
      const records = await ChildVaccinationRecord.find({ givenBy: doctorId })
        .sort({ dateGiven: -1 })
        .limit(50); // Limit to last 50 records
      
      // Populate child information for each record
      const populatedRecords = await Promise.all(
        records.map(async (record) => {
          const child = await Child.findById(record.childId).select('fullName dateOfBirth');
          return {
            _id: record._id,
            childId: record.childId,
            childName: child ? child.fullName : 'Unknown Child',
            vaccineName: record.vaccineName,
            doseNumber: record.doseNumber,
            dateGiven: record.dateGiven,
            location: record.location,
            notes: record.notes
          };
        })
      );
      
      res.json({
        success: true,
        data: populatedRecords
      });
    } catch (error) {
      console.error('Error getting vaccination history by doctor:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get vaccination history by doctor'
      });
    }
  }
);

// Sync vaccination status for a child (for fixing data inconsistencies)
router.post('/sync-status/:childId', 
  verifyJWT, 
  requireUserType(['healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check if user has access to this child
      const Child = require('../models/Child');
      const child = await Child.findById(childId);
      if (!child) {
        return res.status(404).json({
          success: false,
          message: 'Child not found'
        });
      }

      const result = await VaccinationService.syncVaccinationStatus(childId);
      
      res.json({
        success: true,
        message: 'Vaccination status synced successfully',
        data: result
      });
    } catch (error) {
      console.error('Error syncing vaccination status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync vaccination status'
      });
    }
  }
);

module.exports = router;
