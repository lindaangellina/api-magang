import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const mulai = Date.now();

  // "finish" terpanggil setelah response selesai dikirim, jadi status code sudah final
  res.on("finish", () => {
    logger.info("request selesai", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durasiMs: Date.now() - mulai,
    });
  });

  next();
}