import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken";
import { db } from "../db";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token === "null" || token === "undefined") {
      console.warn(`[Auth] No valid token provided for path: ${req.path}. Header: ${authHeader}`);
      throw new Error("Authentication required");
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await db.findById("users", decoded.id);

      if (!user) {
        console.warn(`[Auth] User not found for id: ${decoded.id} in collection 'users'`);
        throw new Error("User not found");
      }

      req.user = user;
      next();
    } catch (jwtError: any) {
      console.error(`[Auth] JWT Verification failed for token ${token.substring(0, 10)}...:`, jwtError.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (error: any) {
    if (res.headersSent) return;
    console.error("[Auth] Authentication error:", error.message);
    res.status(401).json({ error: error.message || "Please authenticate" });
  }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await db.findById("users", decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error: any) {
    // If token is invalid, we still proceed as guest but without req.user
    next();
  }
};
