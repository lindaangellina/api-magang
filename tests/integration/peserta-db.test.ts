// Dua integration test buatan sendiri: query filter/pagination dan foreign key yang sungguhan.
import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/database.config";
import { bersihkanDatabase } from "../helpers/db";
import { bearer, tokenMentor, tokenPeserta } from "../helpers/token";

const nomor = (i: number) => String(i).padStart(2, "0");

async function seedPeserta(jumlah: number): Promise<number[]> {
  const id: number[] = [];
  for (let i = 1; i <= jumlah; i++) {
    const res = await request(app)
      .post("/api/v1/peserta")
      .send({
        nama: `Peserta ${nomor(i)}`,
        sekolah: i % 2 === 1 ? "SMK Alpha" : "SMK Beta", // 8 ganjil (Alpha), 7 genap (Beta)
        email: `peserta${nomor(i)}@mail.com`,
      });
    expect(res.status).toBe(201);
    id.push(res.body.data.id);
  }
  return id;
}

describe("Query peserta di database sungguhan", () => {
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

  describe("GET /peserta dengan 15 data", () => {
    beforeEach(async () => {
      await seedPeserta(15);
    });

    it("pagination: halaman 1 berisi 10, halaman 2 berisi 5, meta konsisten", async () => {
      const h1 = await request(app).get("/api/v1/peserta").query({ page: 1, limit: 10, sortBy: "nama", order: "ASC" });
      const h2 = await request(app).get("/api/v1/peserta").query({ page: 2, limit: 10, sortBy: "nama", order: "ASC" });

      expect(h1.body.data).toHaveLength(10);
      expect(h1.body.meta).toMatchObject({ total: 15, totalPages: 2, hasNext: true, hasPrev: false });
      expect(h2.body.data).toHaveLength(5);
      expect(h2.body.meta).toMatchObject({ page: 2, total: 15, hasNext: false, hasPrev: true });

      // urutan nama benar dan tidak ada data yang muncul di dua halaman
      expect(h1.body.data[0].nama).toBe("Peserta 01");
      expect(h2.body.data[4].nama).toBe("Peserta 15");
      const semuaId = [...h1.body.data, ...h2.body.data].map((p: { id: number }) => p.id);
      expect(new Set(semuaId).size).toBe(15);
    });

    it("filter sekolah: hanya peserta sekolah itu (8 Alpha, 7 Beta)", async () => {
      const alpha = await request(app).get("/api/v1/peserta").query({ sekolah: "SMK Alpha", limit: 100 });
      const beta = await request(app).get("/api/v1/peserta").query({ sekolah: "SMK Beta", limit: 100 });

      expect(alpha.body.meta.total).toBe(8);
      expect(beta.body.meta.total).toBe(7);
      expect(alpha.body.data.every((p: { sekolah: string }) => p.sekolah === "SMK Alpha")).toBe(true);
    });

    it("pencarian q tidak peka huruf besar/kecil, dan % diperlakukan sebagai karakter biasa", async () => {
      const cari = await request(app).get("/api/v1/peserta").query({ q: "peserta 1", limit: 100 });
      expect(cari.body.meta.total).toBe(6); // Peserta 10..15

      const wildcard = await request(app).get("/api/v1/peserta").query({ q: "%" });
      expect(wildcard.body.meta.total).toBe(0);
    });
  });

  it("hapus peserta yang masih punya jurnal: 409, dan peserta tetap ada di database", async () => {
    const [id] = await seedPeserta(1);

    const jurnal = await request(app)
      .post("/api/v1/jurnal")
      .set("Authorization", bearer(tokenPeserta(id)))
      .send({ kegiatan: "Belajar integration test dengan database" });
    expect(jurnal.status).toBe(201);

    const hapus = await request(app).delete(`/api/v1/peserta/${id}`).set("Authorization", bearer(tokenMentor()));
    expect(hapus.status).toBe(409);
    expect(hapus.body.error.kode).toBe("CONFLICT");

    const masihAda = await request(app).get(`/api/v1/peserta/${id}`);
    expect(masihAda.status).toBe(200);
  });

  it("hapus peserta tanpa jurnal: 204, lalu GET menghasilkan 404", async () => {
    const [id] = await seedPeserta(1);

    const hapus = await request(app).delete(`/api/v1/peserta/${id}`).set("Authorization", bearer(tokenMentor()));
    expect(hapus.status).toBe(204);

    const hilang = await request(app).get(`/api/v1/peserta/${id}`);
    expect(hilang.status).toBe(404);
  });
});