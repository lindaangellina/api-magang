import request from "supertest";
import app from "../../src/app";
import { bearer, tokenMentor, tokenPeserta } from "./token";

// Membuat data lewat API (bukan insert langsung) supaya skema dan aturan aplikasi ikut teruji.
export async function buatPesertaLewatApi(urutan: number, sekolah = "SMK Alpha"): Promise<number> {
  const nomor = String(urutan).padStart(2, "0");
  const res = await request(app)
    .post("/api/v1/peserta")
    .send({ nama: `Peserta ${nomor}`, sekolah, email: `peserta${nomor}@mail.com` });
  expect(res.status).toBe(201);
  return res.body.data.id;
}

export async function buatJurnalLewatApi(pesertaId: number, kegiatan: string): Promise<number> {
  const res = await request(app)
    .post("/api/v1/jurnal")
    .set("Authorization", bearer(tokenPeserta(pesertaId)))
    .send({ kegiatan });
  expect(res.status).toBe(201);
  return res.body.data.id;
}

export async function tandaiSudahDireview(jurnalId: number): Promise<void> {
  const res = await request(app)
    .patch(`/api/v1/jurnal/${jurnalId}/review`)
    .set("Authorization", bearer(tokenMentor()))
    .send({ statusReview: "sudah", catatan: "Sudah bagus, lanjutkan" });
  expect(res.status).toBe(200);
}