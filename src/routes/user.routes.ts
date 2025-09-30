import express from "express";

const userRouter = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Fetch current user's profile
 * @access  Private
 */
// userRouter.get("/me");

/**
 * @route   PATCH /api/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
// userRouter.patch("/me");

/**
 * @route   DELETE /api/users/me
 * @desc    Delete current user's profile
 * @access  Private
 */
// userRouter.delete("/me");

/**
 * @route   POST /api/users/request-verification
 * @desc    Send verification email again
 * @access  Private
 */
// userRouter.post("/request-verification");

/**
 * @route   PATCH /api/users/verify
 * @desc    Verify user account
 * @access  Private
 */
// userRouter.patch("/verify");
export default userRouter;
