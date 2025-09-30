import express from "express";
import {
  login,
  logout,
  refreshToken,
  signup,
  verifyEmail,
} from "../controllers/auth.controller";

const authRouter = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user + send verification mail
 * @access  Public
 */
authRouter.post("/signup", signup);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
authRouter.post("/login", login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookies/tokens)
 * @access  Private (but no protect middleware here, handle inside controller)
 */
authRouter.post("/logout", logout);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh expired access token using refresh token
 * @access  Public (relies on valid refresh token cookie/header)
 */
authRouter.post("/refresh-token", refreshToken);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify user's email using token
 * @access  Public
 */
authRouter.get("/verify-email/:token", verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
// authRouter.post("/forgot-password");

/**
 * @route   PATCH /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
// authRouter.patch("/reset-password/:token");

export default authRouter;
