const { Router } = require("express");
const authController = require("../controllers/auth.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUser);
/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
authRouter.post("/login", authController.loginUser);
/**
 * @route GET /api/auth/logout
 * @desc Logout a user
 * @access Public
 */
authRouter.get("/logout", authController.logoutUser);

/**
 * @route GET /api/auth/logout
 * @desc Logout a user
 * @access Private
 */
authRouter.get("/get-me", authMiddleware, authController.getMeController);



module.exports = authRouter;

