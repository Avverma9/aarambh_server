import jwt from 'jsonwebtoken';
import User from '../models/user.model.mjs';

export const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Get token from Authorization header
    let token = req.headers.authorization;
    
    // Remove "Bearer " prefix if present
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
    
    // Fallback to cookie if header not present (for web clients)
    if (!token) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    let decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'matrimony_secret_key'
    );
    
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is no longer valid. User not found.',
      });
    }

    if (user.accountStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired. Please refresh.',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Token verification failed.',
        error: error.message,
      });
    }
  }
};


export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(4404).json({
        success: false,
        message: 'User not found for admin check.',
      });
    }

    if (user.email && user.email.includes('admin@')) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Admin verification failed.',
      error: error.message,
    });
  }
};