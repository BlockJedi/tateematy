const ethers = require('ethers');
const User = require('../models/User');

// Middleware to verify wallet signature
const verifyWalletSignature = async (req, res, next) => {
  try {
    const { walletAddress, signature, message, timestamp } = req.body;

    // Check if required fields are present
    if (!walletAddress || !signature || !message || !timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required authentication fields'
      });
    }

    // Verify timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const messageTime = parseInt(timestamp);
    
    if (Math.abs(currentTime - messageTime) > 300) { // 5 minutes tolerance
      return res.status(401).json({
        success: false,
        message: 'Authentication message expired'
      });
    }

    // Reconstruct the message that was signed
    const expectedMessage = `Login to Tateematy at ${timestamp}`;
    
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Wallet signature verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check if user is authenticated (optional)
const optionalAuth = async (req, res, next) => {
  try {
    const { walletAddress, signature, message, timestamp } = req.body;

    if (walletAddress && signature && message && timestamp) {
      // Try to authenticate
      const currentTime = Math.floor(Date.now() / 1000);
      const messageTime = parseInt(timestamp);
      
      if (Math.abs(currentTime - messageTime) <= 300) {
        const expectedMessage = `Login to Tateematy at ${timestamp}`;
        const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);
        
        if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
          const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
          if (user && user.isActive) {
            req.user = user;
          }
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// JWT Authentication middleware for authenticated routes
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 JWT Middleware - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ JWT Middleware - Invalid auth header format');
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 JWT Middleware - Token received:', token.substring(0, 20) + '...');
    
    if (!token) {
      console.log('❌ JWT Middleware - Empty token after Bearer');
      return res.status(401).json({
        success: false,
        message: 'Missing JWT token'
      });
    }

    // Verify JWT token
    const jwt = require('jsonwebtoken');
    console.log('🔍 JWT Middleware - Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 JWT Middleware - Token decoded successfully:', { 
      id: decoded.id, 
      walletAddress: decoded.walletAddress 
    });
    
    // Find user by ID from token (more reliable than wallet address)
    console.log('🔍 JWT Middleware - Finding user by ID:', decoded.id);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('❌ JWT Middleware - User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ JWT Middleware - User found:', user.fullName);

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ JWT Middleware - User account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    console.log('✅ JWT Middleware - Authentication successful, proceeding to route');
    next();

  } catch (error) {
    console.error('❌ JWT verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check user type
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this user type'
      });
    }

    next();
  };
};

// Middleware to check if user is parent
const requireParent = requireUserType(['parent']);

// Middleware to check if user is healthcare provider
const requireHealthcareProvider = requireUserType(['healthcare_provider']);

// Middleware to check if user is admin
const requireAdmin = requireUserType(['admin']);

// Middleware to check if user can access child data
const canAccessChild = async (req, res, next) => {
  try {
    const { childId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access all children
    if (req.user.userType === 'admin') {
      return next();
    }

    // Healthcare providers can access children in their hospital
    if (req.user.userType === 'healthcare_provider') {
      // This would need to be implemented based on hospital assignments
      // For now, allow access (you can implement hospital-based restrictions later)
      return next();
    }

    // Parents can only access their own children
    if (req.user.userType === 'parent') {
      const Child = require('../models/Child');
      const child = await Child.findOne({ 
        childId, 
        parent: req.user.walletAddress,
        isActive: true 
      });

      if (!child) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this child'
        });
      }

      req.child = child;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    console.error('Child access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access check failed'
    });
  }
};

module.exports = {
  verifyWalletSignature,
  verifyJWT,
  optionalAuth,
  requireUserType,
  requireParent,
  requireHealthcareProvider,
  requireAdmin,
  canAccessChild
};
