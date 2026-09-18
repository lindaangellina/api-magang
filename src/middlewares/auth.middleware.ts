import { Request, Response, NextFunction } from "express";
import { config } from "../config/env.config";
import { AppError, UnauthorizedError } from "../utils/AppError";

export function cekApiKeyUntukDelete(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== "DELETE") {
    next();
    return;
  }

  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    throw new UnauthorizedError("API key tidak ditemukan");
  }

  if (apiKey !== config.security.apiKey) {
    throw new AppError("API key tidak valid", 403);
  }

  next();
}