import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/AppError";

type Role = "peserta" | "mentor";

export function requireRole(...rolesYangDiizinkan: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role || !rolesYangDiizinkan.includes(role)) {
      throw new ForbiddenError(
        `Aksi ini hanya untuk: ${rolesYangDiizinkan.join(", ")}`
      );
    }

    next();
  };
}