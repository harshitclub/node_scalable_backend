import express from "express";

const adminRouter = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Fetch all users (admin only)
 * @access  Private/Admin
 */
// adminRouter.get("/users");

/**
 * @route   GET /api/admin/users/:id
 * @desc    Fetch single user by ID (admin only)
 * @access  Private/Admin
 */
// adminRouter.get("/users/:id");

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Update user details (admin only)
 * @access  Private/Admin
 */
// adminRouter.patch("/users/:id");

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
// adminRouter.delete("/users/:id");

export default adminRouter;
