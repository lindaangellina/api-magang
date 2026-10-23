import { AppDataSource } from "../../src/config/database.config";

// Kosongkan semua tabel entity (tabel migrations tidak ikut) dan reset nomor id.
export async function bersihkanDatabase(): Promise<void> {
  // Pengaman lapis kedua: periksa database yang BENAR-BENAR terhubung, bukan hanya variabel env.
  const namaDb = (AppDataSource.options as { database?: string }).database;
  if (!namaDb?.endsWith("_test")) {
    throw new Error(`TRUNCATE ditolak: database "${namaDb}" bukan database test (harus berakhiran _test).`);
  }

  const tabel = AppDataSource.entityMetadatas.map((m) => `"${m.tableName}"`).join(", ");
  await AppDataSource.query(`TRUNCATE ${tabel} RESTART IDENTITY CASCADE`);
}