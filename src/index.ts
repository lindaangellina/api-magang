import "reflect-metadata"; // WAJIB baris pertama, sebelum import lain

import app from "./app";
import { AppDataSource } from "./config/database.config";
import { config } from "./config/env.config";

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Database terhubung");

    app.listen(config.app.port, () => {
      console.log(`Server berjalan di http://localhost:${config.app.port}`);
    });
  } catch (err) {
    console.error("Gagal konek database:", err);
    process.exit(1);
  }
}

bootstrap();