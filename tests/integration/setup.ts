import "reflect-metadata";
import dotenv from "dotenv";

// Tidak menimpa variabel yang sudah ada (mis. dari CI), jadi .env.test hanya mengisi yang kosong
dotenv.config({ path: ".env.test" });

process.env.NODE_ENV = "test";
process.env.DB_NAME ??= "magang_test";
process.env.JWT_SECRET ??= "secret-integration-test";
process.env.JWT_REFRESH_SECRET ??= "refresh-integration-test";
// env.config mewajibkan dua variabel ini
process.env.JWT_EXPIRES_IN ??= "15m";
process.env.JWT_REFRESH_EXPIRES_IN ??= "7d";

// PENGAMAN WAJIB: integration test menjalankan TRUNCATE (menghapus semua data).
// Jangan pernah izinkan test menyentuh database selain yang berakhiran _test.
if (!process.env.DB_NAME?.endsWith("_test")) {
  throw new Error(
    `Integration test menolak berjalan di database "${process.env.DB_NAME}". ` +
      `Nama database wajib berakhiran _test.`
  );
}