import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { JurnalHarian } from "../entities/Jurnal.entity";

export async function getStatistik() {
  const pesertaRepo = AppDataSource.getRepository(Peserta);
  const jurnalRepo = AppDataSource.getRepository(JurnalHarian);

  const totalPeserta = await pesertaRepo.count();
  const totalJurnal = await jurnalRepo.count();

  const jurnalBelumDireview = await jurnalRepo.count({
    where: { statusReview: "belum" },
  });

  const rataRataJurnalPerPeserta =
    totalPeserta > 0 ? Number((totalJurnal / totalPeserta).toFixed(2)) : 0;

  // QueryBuilder + GROUP BY — jumlah jurnal per peserta
  const jurnalPerPeserta = await jurnalRepo
    .createQueryBuilder("j")
    .select("j.pesertaId", "pesertaId")
    .addSelect("COUNT(*)", "totalJurnal")
    .groupBy("j.pesertaId")
    .getRawMany();

  // Relasi Many-to-Many (Peserta <-> Skill) — skill terpopuler
  const skillTerpopuler = await pesertaRepo
    .createQueryBuilder("p")
    .leftJoin("p.skills", "skill")
    .select("skill.nama", "namaSkill")
    .addSelect("COUNT(*)", "jumlahPeserta")
    .where("skill.id IS NOT NULL")
    .groupBy("skill.nama")
    .orderBy('"jumlahPeserta"', "DESC")
    .getRawMany();

  return {
    totalPeserta,
    totalJurnal,
    jurnalBelumDireview,
    rataRataJurnalPerPeserta,
    jurnalPerPeserta,
    skillTerpopuler,
  };
}