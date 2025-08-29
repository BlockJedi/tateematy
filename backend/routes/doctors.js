const express = require('express');
const router = express.Router();
const { verifyJWT, requireUserType } = require('../middleware/auth');
const DoctorService = require('../services/doctorService');

// Get doctor statistics
router.get('/:doctorId/stats', verifyJWT, requireUserType(['healthcare_provider', 'admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const stats = await DoctorService.getStats(doctorId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting doctor stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get doctor statistics'
    });
  }
});

// Get doctor profile
router.get('/:doctorId', verifyJWT, requireUserType(['healthcare_provider', 'admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await DoctorService.getById(doctorId);
    
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error getting doctor profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get doctor profile'
    });
  }
});

// Update doctor profile
router.put('/:doctorId', verifyJWT, requireUserType(['healthcare_provider', 'admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const updateData = req.body;
    
    const updatedDoctor = await DoctorService.updateProfile(doctorId, updateData, req.user);
    
    res.json({
      success: true,
      data: updatedDoctor
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update doctor profile'
    });
  }
});

// Get doctor's vaccination history
router.get('/:doctorId/vaccinations', verifyJWT, requireUserType(['healthcare_provider', 'admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page, limit, startDate, endDate } = req.query;
    
    const options = { page, limit, startDate, endDate };
    const result = await DoctorService.getVaccinationHistory(doctorId, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting doctor vaccinations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get doctor vaccinations'
    });
  }
});

// Get all doctors (for admin)
router.get('/', verifyJWT, requireUserType(['admin']), async (req, res) => {
  try {
    const { page, limit, search, specialization } = req.query;
    const filters = { search, specialization };
    const pagination = { page, limit };
    
    const result = await DoctorService.getAllDoctors(filters, pagination);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting all doctors:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get all doctors'
    });
  }
});

// Get doctor performance metrics
router.get('/:doctorId/performance', verifyJWT, requireUserType(['healthcare_provider', 'admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { period = 'month' } = req.query;
    
    const metrics = await DoctorService.getPerformanceMetrics(doctorId, period);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting doctor performance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get doctor performance'
    });
  }
});

module.exports = router;
