import express from "express";
import AuthController from "../controllers/authController.js";
import {
  authenticateToken,
  authenticateRefreshToken,
} from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

// Protected routes
router.use(authenticateToken);
router.get("/profile", AuthController.getProfile);
router.put("/profile", AuthController.updateProfile);
router.put("/change-password", AuthController.changePassword);

export default router;
