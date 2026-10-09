import "reflect-metadata"; // WAJIB baris pertama, sebelum import lain

import type { Server } from "http";
import app from "./app";
import { AppDataSource } from "./config/database.config";
import { config } from "./config/env.config";
import { logger } from "./utils/logger";

let server: Server | undefined;
let sedangShutdown = false;

function shutdown(sinyal: string, kodeKeluar: number = 0): void {
  if (sedangShutdown) return; // abaikan sinyal kedua (mis. Ctrl+C dua kali)
  sedangShutdown = true;

  logger.info(`Menerima ${sinyal}, mematikan server...`);

  // Paksa keluar jika proses shutdown menggantung lebih dari 10 detik
  setTimeout(() => {
    logger.error("Shutdown paksa karena timeout");
    process.exit(1);
  }, 10_000).unref();

  const tutupDatabase = async (): Promise<void> => {
    try {
      // 2. Tutup koneksi database
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      logger.info("Server dan koneksi database ditutup dengan rapi");
      process.exit(kodeKeluar);
    } catch (err) {
      logger.error("Gagal menutup database", { error: String(err) });
      process.exit(1);
    }
  };

  // 1. Berhenti menerima request baru, tunggu request yang berjalan selesai
  if (server) server.close(tutupDatabase);
  else void tutupDatabase(); // server belum sempat nyala
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Promise ditolak tanpa .catch(): catat, jangan diam-diam hilang
process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", {
    error: reason instanceof Error ? reason.stack : String(reason),
  });
});

// Exception yang lolos dari semua try/catch: state proses sudah tidak bisa dipercaya
process.on("uncaughtException", (err) => {
  logger.error("uncaughtException", { error: err.stack });
  shutdown("uncaughtException", 1);
});

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  logger.info("Database terhubung");

  server = app.listen(config.app.port, () => {
    logger.info(`Server berjalan di http://localhost:${config.app.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error("Gagal start", { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});