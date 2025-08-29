const express = require('express');
const router = express.Router();
const { verifyJWT, requireUserType } = require('../middleware/auth');
const CertificateService = require('../services/certificateService');
const Certificate = require('../models/Certificate');

const certificateService = new CertificateService();

// Generate certificate
router.post('/generate', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId, certificateType } = req.body;
      
      if (!childId || !certificateType) {
        return res.status(400).json({
          success: false,
          message: 'Child ID and certificate type are required'
        });
      }

      // Check if user has access to this child
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

      const result = await certificateService.generateCertificate(childId, certificateType, req.user._id);
      
      res.json(result);
    } catch (error) {
      console.error('Error generating certificate:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate certificate'
      });
    }
  }
);

// Check certificate eligibility
router.get('/eligibility/:childId/:type', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId, type } = req.params;
      
      // Check if user has access to this child
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

      let requirements;
      switch (type) {
        case 'school_readiness':
          requirements = await certificateService.checkSchoolReadinessRequirements(childId);
          break;
        case 'completion':
          requirements = await certificateService.checkCompletionRequirements(childId);
          break;
        case 'progress':
          requirements = await certificateService.getCurrentProgress(childId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid certificate type'
          });
      }

      res.json({
        success: true,
        data: {
          certificateType: type,
          childId,
          requirements
        }
      });
    } catch (error) {
      console.error('Error checking eligibility:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check eligibility'
      });
    }
  }
);

// Verify certificate on blockchain
router.post('/verify', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { ipfsHash, txHash } = req.body;
      
      if (!ipfsHash || !txHash) {
        return res.status(400).json({
          success: false,
          message: 'IPFS hash and transaction hash are required'
        });
      }

      const verificationResult = await certificateService.verifyCertificate(ipfsHash, txHash);
      
      res.json({
        success: true,
        data: verificationResult
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify certificate'
      });
    }
  }
);

// Get certificate history for a child
router.get('/history/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check if user has access to this child
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

      // Fetch certificate history from database
      const certificateHistory = await Certificate.find({ childId })
        .populate('generatedBy', 'fullName')
        .sort({ createdAt: -1 });

      const formattedHistory = certificateHistory.map(cert => ({
        id: cert.certificateId,
        type: cert.certificateType,
        status: cert.status,
        verified: cert.verified,
        generatedAt: cert.createdAt,
        downloadUrl: `/api/certificates/download/${cert.certificateId}`,
        ipfsHash: cert.ipfsHash,
        blockchainTx: cert.blockchainTx,
        downloadCount: cert.downloadCount,
        lastDownloaded: cert.lastDownloaded
      }));

      res.json({
        success: true,
        data: formattedHistory
      });
    } catch (error) {
      console.error('Error fetching certificate history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch certificate history'
      });
    }
  }
);

// Get existing certificates for a child
router.get('/existing/:childId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check if user has access to this child
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

      const result = await certificateService.getExistingCertificates(childId);
      
      res.json(result);
    } catch (error) {
      console.error('Error getting existing certificates:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get existing certificates'
      });
    }
  }
);

// Download certificate
router.get('/download/:certificateId', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { certificateId } = req.params;
      
      // Find certificate in database
      const certificate = await Certificate.findOne({ certificateId });
      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      // Check if user has access to this child
      if (req.user.userType === 'parent') {
        const Child = require('../models/Child');
        const child = await Child.findOne({ _id: certificate.childId, parent: req.user._id });
        if (!child) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this certificate'
          });
        }
      }
      
      // Increment download count
      await certificate.incrementDownload();
      
      // For blockchain certificates, redirect to IPFS
      if (certificate.ipfsHash) {
        const ipfsUrl = `https://ipfs.io/ipfs/${certificate.ipfsHash}`;
        return res.redirect(ipfsUrl);
      }
      
      // For local certificates, regenerate and serve
      const result = await certificateService.generateCertificate(
        certificate.childId, 
        certificate.certificateType, 
        req.user._id
      );
      
      if (result.success) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${certificate.fileName}"`);
        res.send(Buffer.from(result.data.imageBuffer, 'base64'));
      } else {
        throw new Error('Failed to regenerate certificate');
      }
      
    } catch (error) {
      console.error('Error downloading certificate:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download certificate'
      });
    }
  }
);

// Download certificate image
router.get('/download/:childId/:certificateType', 
  verifyJWT, 
  requireUserType(['parent', 'healthcare_provider', 'admin']),
  async (req, res) => {
    try {
      const { childId, certificateType } = req.params;
      
      // Check if user has access to this child
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

      const result = await certificateService.getCertificateImage(childId, certificateType);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json({
          success: false,
          message: 'Certificate image not found'
        });
      }
    } catch (error) {
      console.error('Error downloading certificate image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download certificate image'
      });
    }
  }
);

module.exports = router;
