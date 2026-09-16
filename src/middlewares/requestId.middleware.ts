import { Request, Response, NextFunction } from "express";

export function tambahRequestId(req: Request, res: Response, next: NextFunction): void {
  const id = Math.random().toString(36).substring(2, 10);
  req.requestId = id; // sekarang tertyped, tidak error, berkat express.d.ts
  res.setHeader("X-Request-Id", id); // ditampilkan di header SETIAP response
  next();
}