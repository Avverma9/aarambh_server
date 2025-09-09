import jwt from 'jsonwebtoken';
import User from '../models/user.model.mjs';

// JWT Authentication Middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matrimony_secret_key');

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is no longer valid. User not found.'
      });
    }

    // Check if account is active
    if (user.accountStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.'
      });
    }

    // Add user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Token verification failed.',
        error: error.message
      });
    }
  }
};

// Optional middleware - check if user is admin
export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    // You can add admin role to user schema or check specific conditions
    // For now, checking if user has admin email or specific field
    if (user.email && user.email.includes('admin@')) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Admin verification failed.',
      error: error.message
    });
  }
};