import User from "../models/User.js";
import JWTUtil from "../utils/jwt.js";
import { ValidationError, UnauthorizedError } from "../middleware/error.js";

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Validate input
      if (!username || !email || !password) {
        throw new ValidationError("Username, email, and password are required");
      }

      // Validate username format
      if (username.length < 3 || username.length > 30) {
        throw new ValidationError(
          "Username must be between 3 and 30 characters",
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Please provide a valid email address");
      }

      // Validate password strength
      if (password.length < 6) {
        throw new ValidationError(
          "Password must be at least 6 characters long",
        );
      }

      // Check if user already exists
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        throw new ValidationError("Email already registered");
      }

      const existingUserByUsername = await User.findByUsername(username);
      if (existingUserByUsername) {
        throw new ValidationError("Username already taken");
      }

      // Create user
      const newUser = await User.create({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Generate tokens
      const tokenPayload = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      };

      const { accessToken, refreshToken } =
        JWTUtil.generateTokenPair(tokenPayload);

      // Set cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: "lax",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            createdAt: newUser.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { identifier, password } = req.body;

      // Validate input
      if (!identifier || !password) {
        throw new ValidationError("Email/username and password are required");
      }

      // Find user by email or username
      const user = await User.findByEmailOrUsername(
        identifier.trim().toLowerCase(),
      );
      if (!user) {
        throw new UnauthorizedError("Invalid credentials");
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(
        password,
        user.password,
      );
      if (!isValidPassword) {
        throw new UnauthorizedError("Invalid credentials");
      }

      // Generate tokens
      const tokenPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      const { accessToken, refreshToken } =
        JWTUtil.generateTokenPair(tokenPayload);

      // Set cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: "lax",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError("Refresh token is required");
      }

      // Verify refresh token
      const decoded = JWTUtil.verifyRefreshToken(refreshToken);

      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedError("User no longer exists");
      }

      // Generate new tokens
      const tokenPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      const { accessToken, refreshToken: newRefreshToken } =
        JWTUtil.generateTokenPair(tokenPayload);

      // Set new cookies
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: "lax",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: "Tokens refreshed successfully",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        },
      });
    } catch (error) {
      if (error.message.includes("Invalid or expired")) {
        next(new UnauthorizedError("Invalid or expired refresh token"));
      } else {
        next(error);
      }
    }
  }

  static async logout(req, res, next) {
    try {
      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      res.json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { username, email } = req.body;
      const updateData = {};

      // Validate and prepare update data
      if (username !== undefined) {
        if (username.length < 3 || username.length > 30) {
          throw new ValidationError(
            "Username must be between 3 and 30 characters",
          );
        }

        // Check if username is already taken by another user
        const existingUser = await User.findByUsername(
          username.trim().toLowerCase(),
        );
        if (existingUser && existingUser.id !== req.user.id) {
          throw new ValidationError("Username already taken");
        }

        updateData.username = username.trim().toLowerCase();
      }

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new ValidationError("Please provide a valid email address");
        }

        // Check if email is already taken by another user
        const existingUser = await User.findByEmail(email.trim().toLowerCase());
        if (existingUser && existingUser.id !== req.user.id) {
          throw new ValidationError("Email already registered");
        }

        updateData.email = email.trim().toLowerCase();
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError("No valid fields provided for update");
      }

      // Update user
      const updatedUser = await User.updateById(req.user.id, updateData);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            updatedAt: updatedUser.updated_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ValidationError(
          "Current password and new password are required",
        );
      }

      if (newPassword.length < 6) {
        throw new ValidationError(
          "New password must be at least 6 characters long",
        );
      }

      // Get user with password
      const user = await User.findById(req.user.id);
      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      // Get user with password for verification
      const userWithPassword = await User.findByEmail(user.email);

      // Verify current password
      const isValidPassword = await User.verifyPassword(
        currentPassword,
        userWithPassword.password,
      );
      if (!isValidPassword) {
        throw new UnauthorizedError("Current password is incorrect");
      }

      // Update password
      await User.updateById(req.user.id, { password: newPassword });

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
