import jwt from 'jsonwebtoken';
import User from '../models/user.model.mjs';

export const authMiddleware = async (req, res, next) => {
  try {

    const token = req.cookies.accessToken;

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
      // Access token has expired, try to refresh it
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Access token expired, no refresh token provided.' });
      }

      try {
        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decodedRefresh.userId);

        if (!user || user.refreshToken !== refreshToken) {
          return res.status(403).json({ success: false, message: 'Invalid refresh token.' });
        }

        // Issue a new access token
        const payload = { userId: user._id, email: user.email };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Set the new access token in the cookie
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Attach user to the request and proceed
        req.user = payload;
        next();

      } catch (refreshError) {
        return res.status(403).json({
          success: false,
          message: 'Refresh token is invalid or expired. Please log in again.',
          error: refreshError.message
        });
      }

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