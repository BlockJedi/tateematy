const express = require('express');
const { body, validationResult } = require('express-validator');
const childService = require('../services/childService');
const { verifyWalletSignature, requireParent, canAccessChild, verifyJWT, requireUserType } = require('../middleware/auth');

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// @route   GET /api/children
// @desc    Get all children for authenticated parent
// @access  Private (Parents only)
router.get('/', [verifyJWT, requireUserType(['parent'])], async (req, res) => {
  try {
    // Get children for the authenticated parent
    const children = await childService.getChildrenByParent(req.user._id);
    
    res.json({
      success: true,
      data: { children }
    });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/children/search
// @desc    Search children by multiple criteria (for doctors)
// @access  Private (Healthcare providers only)
router.get('/search', [verifyJWT, requireUserType(['healthcare_provider', 'admin'])], async (req, res) => {
  try {
    const { q: searchQuery } = req.query;
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    const Child = require('../models/Child');
    const children = await Child.searchChildren(searchQuery.trim());
    
    res.json({
      success: true,
      data: { children },
      searchQuery: searchQuery.trim(),
      totalResults: children.length
    });
    
  } catch (error) {
    console.error('Search children error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/children/available
// @desc    Get all children available for vaccination (for doctors)
// @access  Private (Healthcare providers only)
router.get('/available', [verifyJWT, requireUserType(['healthcare_provider', 'admin'])], async (req, res) => {
  try {
    const Child = require('../models/Child');
    const User = require('../models/User');
    
    // Get all children with their parent information populated
    const children = await Child.find({})
      .populate('parent', 'fullName nationalId')
      .sort({ fullName: 1 });
    
    res.json({
      success: true,
      data: children,
      total: children.length
    });
    
  } catch (error) {
    console.error('Get available children error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/children
// @desc    Add a new child
// @access  Private (Parents only)
router.post('/', [
  verifyJWT,
  requireUserType(['parent']),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('dateOfBirth')
    .isDate()
    .withMessage('Please provide a valid date of birth'),
  
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),
  
  body('birthCertificateNumber')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Birth certificate number must be exactly 10 digits'),
  
  body('nationality')
    .optional()
    .isIn(['Saudi', 'Non-Saudi'])
    .withMessage('Nationality must be either Saudi or Non-Saudi'),
  
  handleValidationErrors
], async (req, res) => {
  try {
    // Use the authenticated parent from JWT token
    const parentId = req.user._id;
    console.log('🔍 Using authenticated parent with ID:', parentId);
    console.log('🔍 Parent user object:', {
      id: req.user._id,
      fullName: req.user.fullName,
      nationalId: req.user.nationalId,
      userType: req.user.userType
    });
    
    const child = await childService.addChild(req.body, parentId);
    
    res.status(201).json({
      success: true,
      message: 'Child added successfully',
      data: { child }
    });
    
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/children/:childId
// @desc    Get specific child details
// @access  Private (Parents can only access their children)
router.get('/:childId', [verifyJWT, requireUserType(['parent'])], async (req, res) => {
  try {
    const child = await childService.getChildDetails(req.params.childId, req.user);
    
    res.json({
      success: true,
      data: { child }
    });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/children/:childId
// @desc    Update child information
// @access  Private (Parents can only update their children)
router.put('/:childId', [
  verifyJWT,
  requireUserType(['parent']),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),
  
  body('emergencyContact.mobile')
    .optional()
    .matches(/^(\+966|966|0)?5\d{8}$/)
    .withMessage('Please enter a valid Saudi mobile number'),
  
  handleValidationErrors
], async (req, res) => {
  try {
    const updatedChild = await childService.updateChild(req.params.childId, req.body, req.user);
    
    res.json({
      success: true,
      message: 'Child information updated successfully',
      data: { child: updatedChild }
    });
    
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/children/:childId
// @desc    Delete/deactivate a child
// @access  Private (Parents can only delete their children)
router.delete('/:childId', [verifyJWT, requireUserType(['parent'])], async (req, res) => {
  try {
    await childService.deactivateChild(req.params.childId, req.user);
    
    res.json({
      success: true,
      message: 'Child record deactivated successfully'
    });
    
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/children/:childId/vaccinations
// @desc    Get child's vaccination schedule and status
// @access  Private (Parents can only access their children)
router.get('/:childId/vaccinations', [verifyJWT, requireUserType(['parent'])], async (req, res) => {
  try {
    const result = await childService.getChildVaccinations(req.params.childId, req.user);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get child vaccinations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/children/:childId/upcoming
// @desc    Get upcoming vaccinations for a child
// @access  Private (Parents can only access their children)
router.get('/:childId/upcoming', [verifyJWT, requireUserType(['parent'])], async (req, res) => {
  try {
    const { days = 30 } = req.query; // Default to 30 days
    const result = await childService.getUpcomingVaccinations(req.params.childId, days, req.user);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get upcoming vaccinations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
