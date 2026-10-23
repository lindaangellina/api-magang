// Query-heavy: GROUP BY, COUNT, JOIN, relasi many-to-many. Mock tidak bisa membuktikan ini,
// jadi diuji di PostgreSQL sungguhan.
import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/database.config";
import { Peserta } from "../../src/entities/Peserta.entity";
import { Skill } from "../../src/entities/Skill.entity";
import { getStatistik } from "../../src/services/stats.service";
import {
  getJurnalDenganPeserta,
  getPesertaDenganJurnal,
  seedSkillDanRelasi,
} from "../../src/services/jurnal-relasi.service";
import { bersihkanDatabase } from "../helpers/db";
import { bearer, tokenMentor } from "../helpers/token";
import { buatJurnalLewatApi, buatPesertaLewatApi, tandaiSudahDireview } from "../helpers/seed";

beforeAll(async () => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
});

beforeEach(async () => {
  await bersihkanDatabase();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("getStatistik (stats.service)", () => {
  it("database kosong: semua angka 0 dan daftar kosong (tidak membagi dengan nol)", async () => {
    const stat = await getStatistik();

    expect(stat).toMatchObject({
      totalPeserta: 0,
      totalJurnal: 0,
      jurnalBelumDireview: 0,
      rataRataJurnalPerPeserta: 0,
      jurnalPerPeserta: [],
      skillTerpopuler: [],
    });
  });

  it("menghitung total, belum direview, rata-rata, dan jumlah jurnal per peserta", async () => {
    const p1 = await buatPesertaLewatApi(1);
    const p2 = await buatPesertaLewatApi(2);
    await buatPesertaLewatApi(3); // tanpa jurnal
    const j1 = await buatJurnalLewatApi(p1, "Belajar integration test hari pertama");
    await buatJurnalLewatApi(p1, "Belajar integration test hari kedua");
    await buatJurnalLewatApi(p2, "Belajar query dengan TypeORM");
    await tandaiSudahDireview(j1);

    const stat = await getStatistik();

    expect(stat.totalPeserta).toBe(3);
    expect(stat.totalJurnal).toBe(3);
    expect(stat.jurnalBelumDireview).toBe(2);
    expect(stat.rataRataJurnalPerPeserta).toBe(1);

    // COUNT(*) dari PostgreSQL berupa string, jadi dibandingkan sebagai angka
    const perPeserta = stat.jurnalPerPeserta
      .map((r: { pesertaId: number; totalJurnal: string }) => [Number(r.pesertaId), Number(r.totalJurnal)])
      .sort((a: number[], b: number[]) => a[0] - b[0]);
    expect(perPeserta).toEqual([[p1, 2], [p2, 1]]); // peserta tanpa jurnal tidak muncul
  });

  it("rata-rata dibulatkan 2 angka desimal", async () => {
    const p1 = await buatPesertaLewatApi(1);
    await buatPesertaLewatApi(2);
    await buatPesertaLewatApi(3);
    await buatJurnalLewatApi(p1, "Jurnal pertama untuk uji pembulatan");

    const stat = await getStatistik();

    expect(stat.rataRataJurnalPerPeserta).toBe(0.33); // 1 / 3
  });

  it("skill terpopuler diurutkan dari yang paling banyak dipakai", async () => {
    await buatPesertaLewatApi(1);
    await buatPesertaLewatApi(2);
    await seedSkillDanRelasi();

    const stat = await getStatistik();

    // PostgreSQL dipakai kedua peserta (irisan slice(0,3) dan slice(2,5)), skill lain hanya satu
    expect(stat.skillTerpopuler[0].namaSkill).toBe("PostgreSQL");
    expect(Number(stat.skillTerpopuler[0].jumlahPeserta)).toBe(2);
    expect(stat.skillTerpopuler).toHaveLength(5);
  });

  it("GET /stats: 200 dan memuat angka statistik", async () => {
    await buatPesertaLewatApi(1);

    const res = await request(app).get("/api/v1/stats");

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain("totalPeserta");
  });
});

describe("jurnal-relasi.service", () => {
  it("getPesertaDenganJurnal memuat daftar jurnal milik peserta", async () => {
    const p1 = await buatPesertaLewatApi(1);
    await buatJurnalLewatApi(p1, "Kegiatan pertama dengan relasi");
    await buatJurnalLewatApi(p1, "Kegiatan kedua dengan relasi");

    const peserta = await getPesertaDenganJurnal(p1);

    expect(peserta?.nama).toBe("Peserta 01");
    expect(peserta?.jurnalList).toHaveLength(2);
  });

  it("getPesertaDenganJurnal mengembalikan null untuk id yang tidak ada", async () => {
    await expect(getPesertaDenganJurnal(9999)).resolves.toBeNull();
  });

  it("getJurnalDenganPeserta menggabungkan nama peserta dengan kegiatannya", async () => {
    const p1 = await buatPesertaLewatApi(1);
    await buatJurnalLewatApi(p1, "Kegiatan untuk uji join");

    const hasil = await getJurnalDenganPeserta();

    expect(hasil).toEqual([{ nama: "Peserta 01", kegiatan: "Kegiatan untuk uji join" }]);
  });

  describe("seedSkillDanRelasi", () => {
    it("membuat 5 skill dan menghubungkan 3 skill ke masing-masing 2 peserta (1 skill dipakai bersama)", async () => {
      await buatPesertaLewatApi(1);
      await buatPesertaLewatApi(2);

      await seedSkillDanRelasi();

      expect(await AppDataSource.getRepository(Skill).count()).toBe(5);
      const pesertaRepo = AppDataSource.getRepository(Peserta);
      const a = await pesertaRepo.findOneOrFail({ where: { id: 1 }, relations: { skills: true } });
      const b = await pesertaRepo.findOneOrFail({ where: { id: 2 }, relations: { skills: true } });
      expect(a.skills).toHaveLength(3);
      expect(b.skills).toHaveLength(3);
      const sama = a.skills.filter((s) => b.skills.some((t) => t.id === s.id));
      expect(sama).toHaveLength(1);
    });

    it("dijalankan dua kali tidak menggandakan skill", async () => {
      await buatPesertaLewatApi(1);
      await buatPesertaLewatApi(2);

      await seedSkillDanRelasi();
      await seedSkillDanRelasi();

      expect(await AppDataSource.getRepository(Skill).count()).toBe(5);
    });

    it("tanpa peserta: skill tetap dibuat dan tidak error", async () => {
      await expect(seedSkillDanRelasi()).resolves.toBeUndefined();

      expect(await AppDataSource.getRepository(Skill).count()).toBe(5);
    });
  });
});

describe("GET /jurnal dengan filter (jurnal.service.daftarJurnal)", () => {
  async function siapkan() {
    const p1 = await buatPesertaLewatApi(1);
    const p2 = await buatPesertaLewatApi(2);
    const j1 = await buatJurnalLewatApi(p1, "Jurnal peserta satu yang pertama");
    await buatJurnalLewatApi(p1, "Jurnal peserta satu yang kedua");
    await buatJurnalLewatApi(p2, "Jurnal peserta dua");
    await tandaiSudahDireview(j1);
    return { p1, p2 };
  }

  const ambil = (query: Record<string, string | number>) =>
    request(app).get("/api/v1/jurnal").query(query).set("Authorization", bearer(tokenMentor()));

  it("tanpa filter: semua jurnal, dengan meta pagination", async () => {
    await siapkan();

    const res = await ambil({});

    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ total: 3, page: 1 });
  });

  it("filter pesertaId hanya mengembalikan jurnal peserta itu", async () => {
    const { p1 } = await siapkan();

    const res = await ambil({ pesertaId: p1 });

    expect(res.body.meta.total).toBe(2);
  });

  it("filter statusReview=sudah hanya mengembalikan jurnal yang sudah direview", async () => {
    await siapkan();

    const sudah = await ambil({ statusReview: "sudah" });
    const belum = await ambil({ statusReview: "belum" });

    expect(sudah.body.meta.total).toBe(1);
    expect(belum.body.meta.total).toBe(2);
  });

  it("filter tanggal: rentang yang mencakup hari ini mengembalikan semua, rentang masa depan kosong", async () => {
    await siapkan();

    const semua = await ambil({ from: "2000-01-01", to: "2999-12-31" });
    const masaDepan = await ambil({ from: "2999-01-01" });

    expect(semua.body.meta.total).toBe(3);
    expect(masaDepan.body.meta.total).toBe(0);
  });

  it("GET /jurnal/:id: 200 untuk jurnal yang ada, 404 untuk yang tidak ada", async () => {
    const p1 = await buatPesertaLewatApi(1);
    const id = await buatJurnalLewatApi(p1, "Jurnal untuk dicari berdasarkan id");

    expect((await request(app).get(`/api/v1/jurnal/${id}`)).status).toBe(200);
    expect((await request(app).get("/api/v1/jurnal/9999")).status).toBe(404);
  });
});