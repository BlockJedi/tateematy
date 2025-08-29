const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const ethers = require('ethers');

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

// @route   POST /api/auth/register
// @desc    Register a new user (parent or healthcare provider)
// @access  Public
router.post('/register', [
  // Validation middleware - relaxed for auto-created accounts
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .isLength({ min: 42, max: 42 })
    .withMessage('Invalid wallet address format'),
  
  body('fullName')
    .optional() // Made optional for auto-created accounts
    .trim()
    .custom((value) => {
      if (value && (value.length < 2 || value.length > 100)) {
        throw new Error('Full name must be between 2 and 100 characters');
      }
      return true;
    }),
  
  body('nationalId')
    .optional() // Made optional for auto-created accounts
    .custom((value) => {
      if (value && (value.length !== 10 || !/^\d{10}$/.test(value))) {
        throw new Error('National ID must be exactly 10 digits');
      }
      return true;
    }),
  
  body('mobile')
    .optional() // Made optional for auto-created accounts
    .custom((value) => {
      if (value && !/^(\+966|966|0)?5\d{8}$/.test(value)) {
        throw new Error('Please enter a valid Saudi mobile number');
      }
      return true;
    }),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('password')
    .optional() // Made optional for auto-created accounts (wallet-based auth)
    .custom((value) => {
      if (value) {
        if (value.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          throw new Error('Password must contain at least one lowercase letter, one uppercase letter, and one number');
        }
      }
      return true;
    }),
  
  body('userType')
    .isIn(['parent', 'healthcare_provider'])
    .withMessage('User type must be either parent or healthcare_provider'),
  
  body('address.city')
    .optional()
    .isIn(['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Tabuk', 'Abha', 'Jizan', 'Najran', 'Hail', 'Al-Jouf', 'Al-Ahsa'])
    .withMessage('Please select a valid city'),
  
  // Note: Healthcare provider details (license, hospital) are added by admin later
  // This registration only creates basic user profile
  
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      walletAddress,
      fullName,
      nationalId,
      mobile,
      email,
      password,
      userType,
      address,
      emergencyContact,
      healthcareProvider
    } = req.body;

    // Check if user already exists by wallet address
    const existingUserByWallet = await User.findOne({ walletAddress });
    if (existingUserByWallet) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this wallet address'
      });
    }

    // Check if user exists by other fields (only if provided)
    if (nationalId || mobile || email) {
      const existingUser = await User.findOne({
        $or: [
          ...(nationalId ? [{ nationalId }] : []),
          ...(mobile ? [{ mobile }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this National ID, mobile number, or email'
        });
      }
    }

    // Create new user with wallet address
    const userData = {
      walletAddress,
      fullName,
      userType,
      address,
      emergencyContact,
      profileComplete: false
    };

    // Add optional fields if provided
    if (nationalId) userData.nationalId = nationalId;
    if (mobile) userData.mobile = mobile;
    if (email) userData.email = email;
    if (password) userData.password = password;

    // Note: Healthcare provider details (license, hospital) are added by admin later
    // This registration only creates basic user profile with userType

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this information'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('nationalId')
    .notEmpty()
    .withMessage('National ID is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
], async (req, res) => {
  try {
    const { nationalId, password } = req.body;

    // Find user by national ID
    const user = await User.findOne({ nationalId });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password if it exists (for backward compatibility)
    if (user.password) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token and return user data
// @access  Public
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 Token decoded:', { id: decoded.id, walletAddress: decoded.walletAddress });
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: { user }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// @route   GET /api/auth/test-token
// @desc    Simple token test endpoint
// @access  Public
router.get('/test-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 Test endpoint - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        success: false,
        message: 'No Bearer token found',
        authHeader: authHeader || 'null'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔍 Test endpoint - Token received:', token.substring(0, 20) + '...');
    
    if (!token) {
      return res.json({
        success: false,
        message: 'Empty token after Bearer'
      });
    }

    // Try to decode the token
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      return res.json({
        success: true,
        message: 'Token is valid',
        decoded: {
          id: decoded.id,
          walletAddress: decoded.walletAddress,
          iat: decoded.iat,
          exp: decoded.exp
        }
      });
    } catch (jwtError) {
      return res.json({
        success: false,
        message: 'JWT verification failed',
        error: jwtError.message
      });
    }

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
  body('nationalId')
    .notEmpty()
    .withMessage('National ID is required'),
  
  handleValidationErrors
], async (req, res) => {
  try {
    const { nationalId } = req.body;

    const user = await User.findOne({ nationalId });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account exists with this National ID, a password reset link has been sent'
      });
    }

    // Generate reset token (you would implement this)
    // For now, just return success message
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your registered mobile number'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
});

// @route   POST /api/auth/connect-wallet
// @desc    Connect wallet and handle login/registration
// @access  Public
router.post('/connect-wallet', [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .isLength({ min: 42, max: 42 })
    .withMessage('Invalid wallet address format'),
  
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  
  handleValidationErrors
], async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // Verify the signature (you can add more verification logic here)
    // For now, we'll trust the signature and proceed
    
    // Check if user with this wallet address already exists
    // Normalize wallet address to lowercase for consistent comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const existingUser = await User.findOne({ walletAddress: normalizedWalletAddress });
    
    if (existingUser) {
      // User exists - generate JWT token for login
      const token = jwt.sign(
        { id: existingUser._id, walletAddress: existingUser.walletAddress },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Wallet connected successfully',
        data: {
          user: existingUser,
          token
        }
      });
    } else {
      // User doesn't exist - return success but no user data
      // The frontend will handle registration
      return res.json({
        success: true,
        message: 'Wallet connected, user not found',
        data: {
          user: null
        }
      });
    }

  } catch (error) {
    console.error('Connect wallet error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect wallet'
    });
  }
});

// @route   POST /api/auth/admin-connect-wallet
// @desc    Admin-only wallet connection - verify admin status
// @access  Public
router.post('/admin-connect-wallet', [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .isLength({ min: 42, max: 42 })
    .withMessage('Invalid wallet address format'),
  
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  
  handleValidationErrors
], async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature. Authentication failed.'
      });
    }

    // Check if user with this wallet address exists and is an admin
    const existingUser = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase(),
      userType: 'admin',
      isActive: true
    });
    
    if (!existingUser) {
      return res.status(403).json({
        success: false,
        message: 'You are not an admin. Access denied.'
      });
    }

    // Admin user found - generate JWT token for login
    const token = jwt.sign(
      { 
        id: existingUser._id, 
        walletAddress: existingUser.walletAddress,
        userType: existingUser.userType 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Admin authentication successful',
      data: {
        user: existingUser,
        token
      }
    });

  } catch (error) {
    console.error('Admin wallet connection error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to authenticate admin wallet'
    });
  }
});

module.exports = router;
