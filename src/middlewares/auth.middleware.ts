import { Request, Response, NextFunction } from "express";
import { verifikasiToken, JwtPayload } from "../utils/jwt";
import { UnauthorizedError } from "../utils/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token tidak ditemukan");
  }

  const token = authHeader.split(" ")[1];

  // Jangan tangkap error di sini — biarkan error asli JWT (TokenExpiredError /
  // JsonWebTokenError) mengalir ke errorHandler, supaya diterjemahkan jadi
  // TOKEN_EXPIRED atau INVALID_TOKEN yang tepat.
  const payload = verifikasiToken(token);
  req.user = payload;
  next();
}