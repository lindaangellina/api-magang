import jwt from "jsonwebtoken";
import { config } from "../config/env.config";

export interface JwtPayload {
  id: number;
  email: string;
  role: "peserta" | "mentor";
}

export function buatToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifikasiToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}