// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY as string;
interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({ status: 1, result: "Access denied. No token provided." });
  }

  jwt.verify(token, ACCESS_TOKEN_KEY, (err, user) => {
    if (err) {
      res.json({ status: 1, result: "Invalid or expired token." });
    }

    req.user = user;
    next();
  });
}
