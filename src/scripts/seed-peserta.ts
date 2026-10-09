import "reflect-metadata";
import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { hashPassword } from "../utils/password";
import { logger } from "../utils/logger";

const SEKOLAH_LIST = ["SMK Negeri 1", "SMK Negeri 2", "SMK Negeri 3", "SMK Negeri 5", "SMK Taruna"];
const NAMA_DEPAN = ["Budi", "Siti", "Agus", "Dewi", "Rian", "Putri", "Dedi", "Lina", "Fajar", "Mega"];
const NAMA_BELAKANG = ["Santoso", "Wijaya", "Pratama", "Lestari", "Kurnia", "Saputra", "Utami", "Hidayat"];

async function seed() {
  await AppDataSource.initialize();
  logger.info("Database terhubung, mulai seeding");

  const repo = AppDataSource.getRepository(Peserta);
  const passwordHash = await hashPassword("dummy12345");

  const dataDummy: Partial<Peserta>[] = [];

  for (let i = 1; i <= 50; i++) {
    const depan = NAMA_DEPAN[i % NAMA_DEPAN.length];
    const belakang = NAMA_BELAKANG[i % NAMA_BELAKANG.length];
    const nama = `${depan} ${belakang} ${i}`;
    const sekolah = SEKOLAH_LIST[i % SEKOLAH_LIST.length];
    const email = `dummy${i}@mail.com`;

    dataDummy.push({
      nama,
      sekolah,
      email,
      password: passwordHash,
      role: "peserta",
      fase: (i % 3) + 1,
    });
  }

  for (const data of dataDummy) {
    const sudahAda = await repo.findOneBy({ email: data.email });
    if (!sudahAda) {
      await repo.save(repo.create(data));
    }
  }

  logger.info("Seeding selesai", { jumlah: 50 });
  await AppDataSource.destroy();
}

seed().catch((err) => {
  logger.error("Gagal seeding", { error: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});