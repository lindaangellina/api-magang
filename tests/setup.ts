// Dijalankan SEBELUM modul aplikasi di-import.
// env.config melempar error kalau variabel wajib tidak ada, jadi isi semuanya di sini.
import "reflect-metadata";

process.env.NODE_ENV = "test";
process.env.DB_NAME = "magang_test";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.JWT_SECRET = "secret-khusus-test";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_SECRET = "refresh-khusus-test";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";