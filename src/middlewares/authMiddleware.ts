import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { verifyAccessToken } from "../utils/jwt";
import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "../types/JWTPayload";

// Extend Request interface to include tokenValue property
declare module "express-serve-static-core" {
  interface Request {
    user?: AccessTokenPayload;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized: Missing Token", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Unauthorized: Token not provided", 401);
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new AppError("Unauthorized: Invalid Token", 401);
    }

    req.user = decoded as { id: string };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Access token expired" });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};
