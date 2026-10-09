import dotenv from "dotenv";
dotenv.config();

function wajibAda(nama: string): string {
  const nilai = process.env[nama];
  if (!nilai) {
    throw new Error(`Environment variable ${nama} wajib diisi di file .env`);
  }
  return nilai;
}

function opsional(nama: string, bawaan: string): string {
  return process.env[nama] ?? bawaan;
}

export const config = {
  app: {
    name: opsional("APP_NAME", "API Magang Batch 4"),
    port: Number(opsional("PORT", "3000")),
    env: opsional("NODE_ENV", "development"),
  },
  db: {
    host: opsional("DB_HOST", "localhost"),
    port: Number(opsional("DB_PORT", "5432")),
    name: wajibAda("DB_NAME"),
    user: wajibAda("DB_USER"),
    password: wajibAda("DB_PASSWORD"),
  },
  jwt: {
    secret: wajibAda("JWT_SECRET"),
    expiresIn: opsional("JWT_EXPIRES_IN", "15m"),
    refreshSecret: wajibAda("JWT_REFRESH_SECRET"),
    refreshExpiresIn: opsional("JWT_REFRESH_EXPIRES_IN", "7d"),
  },
  cors: {
    origins: opsional("CORS_ORIGINS", "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
  },
} as const;

export const isDev = config.app.env === "development";
export const isProd = config.app.env === "production";