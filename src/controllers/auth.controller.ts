import { prisma } from "../configs/prisma";
import { Request, Response } from "express";
import { loginSchema, signupSchema } from "../validators/auth.validator";
import { AppError } from "../utils/appError";
import { comparePassword, hashPassword } from "../utils/password";
import { logger } from "../configs/logger";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  verifyRefreshToken,
  verifyVerificationToken,
} from "../utils/jwt";
import { verifyEmailTemplate } from "../templates/verifyEmail";
import emailQueue from "../queues/email.queue";
import redisCache from "../configs/redisCache";

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Validate input
    const parsed = await signupSchema.safeParseAsync(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400);
    }

    const { name, email, password } = parsed.data;

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password);

    const verificationToken = generateVerificationToken({ email: email });

    // 5. Save user in DB
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken: verificationToken,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${newUser.email}`);

    const mailData = {
      to: newUser.email,
      subject: "Verify your email",
      html: verifyEmailTemplate({
        name: newUser.name,
        token: verificationToken,
      }),
    };

    await emailQueue.add("verificationEmail", mailData, {
      jobId: `verify:${newUser.id}`, // prevents duplicates
    });

    // 7. Return response
    return res.status(201).json({
      message:
        "Signup successful. Please check your email to verify your account.",
      user: newUser,
    });
  } catch (error: any) {
    logger.error("Signup error:", error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = await loginSchema.safeParseAsync(req.body);
    if (!parsed.success) throw new AppError("Validation failed", 400);

    const { email, password } = parsed.data;

    // 1. Get user from DB
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        password: true,
      },
    });

    if (!user) throw new AppError("Invalid credentials", 401);

    // 2. Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) throw new AppError("Invalid credentials", 401);

    // 3. Generate tokens
    const accessToken = generateAccessToken({ id: user.id });
    const refreshToken = generateRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // 4. Set cookie
    res.cookie("slb_refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...safeUser } = user;

    // 5. Return response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: safeUser,
      slb_access_token: accessToken,
    });
  } catch (error) {
    logger.error("Login error:", error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  const token = req.cookies.slb_refresh_token;
  try {
    if (token) {
      const decode = verifyRefreshToken(token) as { id: string };

      await prisma.user.update({
        where: { id: decode.id },
        data: { refreshToken: null },
      });
    }
  } catch (err) {
    logger.error("Logout error:", err);
  }

  res.clearCookie("slb_refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  const token = req.cookies.slb_refresh_token;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = verifyRefreshToken(token) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== token) return res.sendStatus(403);

    // Generate new tokens
    const newAccessToken = generateAccessToken({ id: user.id });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    // Rotate refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie("slb_refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      slb_access_token: newAccessToken,
    });
  } catch (error) {
    logger.error("Refresh token error:", error);
    return res.sendStatus(403);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { token } = req.params;
    if (!token) throw new AppError("Token is required", 400);

    const decoded = verifyVerificationToken(token) as { email: string };

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });
    if (!user) throw new AppError("Invalid token", 400);
    if (user.isVerified) throw new AppError("Email already verified", 400);

    // Extra check: match DB-stored token
    if (user.verificationToken !== token) {
      throw new AppError("Invalid or expired token", 400);
    }

    await prisma.user.update({
      where: { email: decoded.email },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    logger.error(
      "Email verification error:",
      error instanceof Error ? error.message : error
    );

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<any> => {
  try {
  } catch (error) {}
};
