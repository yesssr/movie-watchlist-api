import JWTUtil from "../utils/jwt.js";
import User from "../models/User.js";

const authenticateToken = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = req.cookies.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify the token
    const decoded = JWTUtil.verifyAccessToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.message.includes("Invalid or expired")) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Token verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const authenticateRefreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // Verify the refresh token
    const decoded = JWTUtil.verifyRefreshToken(refreshToken);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.message.includes("Invalid or expired")) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Refresh token verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = req.cookies.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(" ")[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = JWTUtil.verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    req.user = user
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
        }
      : null;

    next();
  } catch (error) {
    // If token is invalid, continue without user
    req.user = null;
    next();
  }
};

export { authenticateToken, authenticateRefreshToken, optionalAuth };
