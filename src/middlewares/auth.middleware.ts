import { Request, Response, NextFunction } from "express";

export function cekApiKeyUntukDelete(req: Request, res: Response, next: NextFunction): void {
  // Kalau bukan DELETE, langsung lewat tanpa pengecekan apapun
  if (req.method !== "DELETE") {
    next();
    return;
  }

  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    res.status(401).json({ error: "API key tidak ditemukan" });
    return;
  }

  if (apiKey !== process.env.API_KEY) {
    res.status(403).json({ error: "API key tidak valid" });
    return;
  }

  next();
}