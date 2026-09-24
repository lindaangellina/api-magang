import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { Skill } from "../entities/Skill.entity";

export async function getPesertaDenganJurnal(id: number) {
  const pesertaRepo = AppDataSource.getRepository(Peserta);

  const peserta = await pesertaRepo.findOne({
    where: { id },
    relations: { jurnalList: true },
  });

  return peserta;
}

export async function getJurnalDenganPeserta() {
  const jurnalRepo = AppDataSource.getRepository(JurnalHarian);

  const jurnal = await jurnalRepo.find({
    relations: { peserta: true },
  });

  return jurnal.map((j) => ({
    nama: j.peserta.nama,
    kegiatan: j.kegiatan,
  }));
}

export async function seedSkillDanRelasi() {
  const skillRepo = AppDataSource.getRepository(Skill);
  const pesertaRepo = AppDataSource.getRepository(Peserta);

  // 1. Buat 5 skill (kalau belum ada)
  const namaSkill = ["TypeScript", "Express", "PostgreSQL", "TypeORM", "Git"];
  for (const nama of namaSkill) {
    const sudahAda = await skillRepo.findOneBy({ nama });
    if (!sudahAda) {
      await skillRepo.save(skillRepo.create({ nama }));
    }
  }

  const semuaSkill = await skillRepo.find();

  // 2. Hubungkan ke 2 peserta
  const peserta1 = await pesertaRepo.findOneBy({ id: 1 }); // Linda
  const peserta2 = await pesertaRepo.findOneBy({ id: 2 }); // Aura

  if (peserta1) {
    peserta1.skills = semuaSkill.slice(0, 3); // 3 skill pertama
    await pesertaRepo.save(peserta1);
  }
  if (peserta2) {
    peserta2.skills = semuaSkill.slice(2, 5); // 3 skill terakhir
    await pesertaRepo.save(peserta2);
  }

  console.log("Seed skill & relasi selesai");
}