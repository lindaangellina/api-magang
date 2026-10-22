// SOAL 3 dan pelengkap peta kontrak: Express nyata + service di-mock.
import request from "supertest";
import app from "../../src/app";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../../src/utils/AppError";
import { bearer, tokenMentor, tokenPeserta } from "../helpers/token";
import { resetMockServices } from "../helpers/mockServices";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());
import * as services from "../../src/services";
import { authService, jurnalService, pesertaService } from "../../src/services";

beforeEach(() => resetMockServices(services as unknown as Record<string, unknown>));

describe("POST /auth/register", () => {
  const body = {
    nama: "Budi Santoso", sekolah: "SMK 5 Malang", email: "budi@mail.com",
    password: "rahasia123", konfirmasiPassword: "rahasia123",
  };

  it("a. sukses: 201, Location, dan body tidak memuat password", async () => {
    jest.mocked(authService.register).mockResolvedValue({
      id: 1, nama: "Budi Santoso", sekolah: "SMK 5 Malang", email: "budi@mail.com", password: "HASH_RAHASIA", role: "peserta",
    } as never);

    const res = await request(app).post("/api/v1/auth/register").send(body);

    expect(res.status).toBe(201);
    expect(res.headers.location).toMatch(/\/peserta\/1$/);
    expect(res.body.data).not.toHaveProperty("password");
    expect(JSON.stringify(res.body)).not.toContain("HASH_RAHASIA");
  });

  it("a. konfirmasiPassword tidak diteruskan ke service", async () => {
    jest.mocked(authService.register).mockResolvedValue({ id: 1 } as never);

    await request(app).post("/api/v1/auth/register").send(body);

    expect(authService.register).toHaveBeenCalledWith({
      nama: "Budi Santoso", sekolah: "SMK 5 Malang", email: "budi@mail.com", password: "rahasia123",
    });
  });

  it("b. email duplikat (service melempar ConflictError): 409 CONFLICT", async () => {
    jest.mocked(authService.register).mockRejectedValue(new ConflictError("Email sudah terdaftar"));

    const res = await request(app).post("/api/v1/auth/register").send(body);

    expect(res.status).toBe(409);
    expect(res.body.error.kode).toBe("CONFLICT");
  });
});

describe("POST /auth/login, refresh, logout", () => {
  it("c. kredensial salah (service melempar UnauthorizedError): 401 UNAUTHORIZED", async () => {
    jest.mocked(authService.login).mockRejectedValue(new UnauthorizedError("Email atau password salah"));

    const res = await request(app).post("/api/v1/auth/login").send({ email: "budi@mail.com", password: "salah" });

    expect(res.status).toBe(401);
    expect(res.body.error.kode).toBe("UNAUTHORIZED");
    expect(res.body.error.pesan).toBe("Email atau password salah");
  });

  it("login sukses: 200 dengan token dan peserta tanpa password", async () => {
    jest.mocked(authService.login).mockResolvedValue({
      accessToken: "ACCESS", refreshToken: "REFRESH",
      peserta: { id: 1, nama: "Budi", email: "budi@mail.com", password: "HASH_RAHASIA" },
    } as never);

    const res = await request(app).post("/api/v1/auth/login").send({ email: "budi@mail.com", password: "benar123" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ accessToken: "ACCESS", refreshToken: "REFRESH" });
    expect(JSON.stringify(res.body)).not.toContain("HASH_RAHASIA");
  });

  it("refresh sukses: 200 dengan access token baru", async () => {
    jest.mocked(authService.refresh).mockResolvedValue({ accessToken: "ACCESS_BARU" } as never);

    const res = await request(app).post("/api/v1/auth/refresh").send({ refreshToken: "REFRESH" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ accessToken: "ACCESS_BARU" });
  });

  it("refresh tanpa refreshToken: 422 dan service tidak dipanggil", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({});

    expect(res.status).toBe(422);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it("logout: 200 dan service menerima refreshToken yang dikirim", async () => {
    jest.mocked(authService.logout).mockResolvedValue(undefined as never);

    const res = await request(app).post("/api/v1/auth/logout").send({ refreshToken: "REFRESH" });

    expect(res.status).toBe(200);
    expect(authService.logout).toHaveBeenCalledWith("REFRESH");
  });
});

describe("GET /peserta", () => {
  it("d. query lengkap: service menerima nilai yang benar (angka, order huruf besar)", async () => {
    jest.mocked(pesertaService.daftarPeserta).mockResolvedValue({ data: [], total: 0 } as never);

    const res = await request(app)
      .get("/api/v1/peserta")
      .query({ page: 2, limit: 5, q: "budi", sortBy: "nama", order: "asc" });

    expect(res.status).toBe(200);
    expect(pesertaService.daftarPeserta).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5, q: "budi", sortBy: "nama", order: "ASC" }),
      expect.anything()
    );
    expect(res.body.meta).toMatchObject({ page: 2, limit: 5, total: 0 });
  });

  it("e. sortBy=password ditolak: 422 dan service tidak dipanggil", async () => {
    const res = await request(app).get("/api/v1/peserta").query({ sortBy: "password" });

    expect(res.status).toBe(422);
    expect(res.body.error.detail.map((d: { field: string }) => d.field)).toContain("sortBy");
    expect(pesertaService.daftarPeserta).not.toHaveBeenCalled();
  });
});

describe("POST /peserta dan GET /peserta/:id/jurnal", () => {
  it("POST /peserta sukses: 201 dengan Location", async () => {
    jest.mocked(pesertaService.buatPeserta).mockResolvedValue({ id: 9, nama: "Peserta Uji", email: "uji@mail.com" } as never);

    const res = await request(app)
      .post("/api/v1/peserta")
      .send({ nama: "Peserta Uji", sekolah: "SMK Uji", email: "uji@mail.com" });

    expect(res.status).toBe(201);
    expect(res.headers.location).toMatch(/\/peserta\/9$/);
  });

  it("GET /peserta/:id/jurnal sukses: 200 dengan nama peserta dan daftar jurnal", async () => {
    jest.mocked(jurnalService.getJurnalByPeserta).mockResolvedValue({ peserta: "Budi", jurnal: [] } as never);

    const res = await request(app).get("/api/v1/peserta/1/jurnal");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ peserta: "Budi", jurnal: [] });
  });
});

describe("PATCH dan DELETE /peserta/:id", () => {
  it("peserta tidak boleh mengubah peserta lain: 403 dan service tidak dipanggil", async () => {
    const res = await request(app)
      .patch("/api/v1/peserta/2")
      .set("Authorization", bearer(tokenPeserta(1)))
      .send({ nama: "Budi Santoso" });

    expect(res.status).toBe(403);
    expect(res.body.error.kode).toBe("FORBIDDEN");
    expect(pesertaService.ubahProfil).not.toHaveBeenCalled();
  });

  it("mentor boleh mengubah peserta mana pun", async () => {
    jest.mocked(pesertaService.ubahProfil).mockResolvedValue({ id: 2, nama: "Budi Santoso" } as never);

    const res = await request(app)
      .patch("/api/v1/peserta/2")
      .set("Authorization", bearer(tokenMentor()))
      .send({ nama: "Budi Santoso" });

    expect(res.status).toBe(200);
    expect(pesertaService.ubahProfil).toHaveBeenCalledWith(2, { nama: "Budi Santoso" });
  });

  it("f. DELETE /peserta/1 sukses sebagai mentor: 204 tanpa body", async () => {
    jest.mocked(pesertaService.hapusPeserta).mockResolvedValue(undefined);

    const res = await request(app).delete("/api/v1/peserta/1").set("Authorization", bearer(tokenMentor()));

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
  });

  it("g. DELETE /peserta/99 (service melempar NotFoundError): 404 NOT_FOUND", async () => {
    jest.mocked(pesertaService.hapusPeserta).mockRejectedValue(new NotFoundError("Peserta"));

    const res = await request(app).delete("/api/v1/peserta/99").set("Authorization", bearer(tokenMentor()));

    expect(res.status).toBe(404);
    expect(res.body.error.kode).toBe("NOT_FOUND");
  });

  it("peserta tidak boleh menghapus peserta: 403 dan service tidak dipanggil", async () => {
    const res = await request(app).delete("/api/v1/peserta/1").set("Authorization", bearer(tokenPeserta()));

    expect(res.status).toBe(403);
    expect(pesertaService.hapusPeserta).not.toHaveBeenCalled();
  });
});

describe("/me", () => {
  it("GET /me dengan token valid: 200 dan data milik pemilik token, tanpa password", async () => {
    jest.mocked(pesertaService.getPesertaById).mockResolvedValue({ id: 7, nama: "Budi", password: "HASH_RAHASIA" } as never);

    const res = await request(app).get("/api/v1/me").set("Authorization", bearer(tokenPeserta(7)));

    expect(res.status).toBe(200);
    expect(pesertaService.getPesertaById).toHaveBeenCalledWith(7);
    expect(JSON.stringify(res.body)).not.toContain("HASH_RAHASIA");
  });

  it("GET /me/jurnal: 200 dengan total", async () => {
    jest.mocked(jurnalService.getJurnalSaya).mockResolvedValue([{ id: 1 }, { id: 2 }] as never);

    const res = await request(app).get("/api/v1/me/jurnal").set("Authorization", bearer(tokenPeserta(7)));

    expect(res.status).toBe(200);
    expect(jurnalService.getJurnalSaya).toHaveBeenCalledWith(7);
  });
});

describe("/jurnal", () => {
  it("POST /jurnal: 201 dan pesertaId diambil dari token, bukan dari body", async () => {
    jest.mocked(jurnalService.buatJurnal).mockResolvedValue({ id: 5, pesertaId: 7 } as never);

    const res = await request(app)
      .post("/api/v1/jurnal")
      .set("Authorization", bearer(tokenPeserta(7)))
      .send({ kegiatan: "Belajar test HTTP dengan Supertest" });

    expect(res.status).toBe(201);
    expect(jurnalService.buatJurnal).toHaveBeenCalledWith(7, expect.objectContaining({ kegiatan: "Belajar test HTTP dengan Supertest" }));
  });

  it("POST /jurnal dengan pesertaId di body: 422", async () => {
    const res = await request(app)
      .post("/api/v1/jurnal")
      .set("Authorization", bearer(tokenPeserta(7)))
      .send({ kegiatan: "Belajar test HTTP dengan Supertest", pesertaId: 1 });

    expect(res.status).toBe(422);
    expect(jurnalService.buatJurnal).not.toHaveBeenCalled();
  });

  it("GET /jurnal/:id yang tidak ada: 404 NOT_FOUND", async () => {
    jest.mocked(jurnalService.getJurnalById).mockRejectedValue(new NotFoundError("Jurnal"));

    const res = await request(app).get("/api/v1/jurnal/999");

    expect(res.status).toBe(404);
    expect(res.body.error.kode).toBe("NOT_FOUND");
  });

  it("GET /jurnal/:id sukses: 200", async () => {
    jest.mocked(jurnalService.getJurnalById).mockResolvedValue({ id: 1, kegiatan: "Belajar test HTTP" } as never);

    const res = await request(app).get("/api/v1/jurnal/1");

    expect(res.status).toBe(200);
    expect(jurnalService.getJurnalById).toHaveBeenCalledWith(1);
  });

  it("PUT /jurnal/:id sukses: 200 dan service menerima id, userId, role, data", async () => {
    jest.mocked(jurnalService.updateJurnal).mockResolvedValue({ id: 1 } as never);

    const res = await request(app)
      .put("/api/v1/jurnal/1")
      .set("Authorization", bearer(tokenPeserta(7)))
      .send({ kegiatan: "Kegiatan yang sudah diperbaiki" });

    expect(res.status).toBe(200);
    expect(jurnalService.updateJurnal).toHaveBeenCalledWith(1, 7, "peserta", expect.objectContaining({ kegiatan: "Kegiatan yang sudah diperbaiki" }));
  });

  it("PUT /jurnal/:id milik orang lain (service melempar ForbiddenError): 403", async () => {
    jest.mocked(jurnalService.updateJurnal).mockRejectedValue(new ForbiddenError("Kamu tidak berhak mengubah jurnal ini"));

    const res = await request(app)
      .put("/api/v1/jurnal/1")
      .set("Authorization", bearer(tokenPeserta(8)))
      .send({ kegiatan: "Mencoba mengubah jurnal orang lain" });

    expect(res.status).toBe(403);
    expect(res.body.error.kode).toBe("FORBIDDEN");
  });

  it("DELETE /jurnal/:id sukses: 204 tanpa body", async () => {
    jest.mocked(jurnalService.hapusJurnal).mockResolvedValue(undefined);

    const res = await request(app).delete("/api/v1/jurnal/1").set("Authorization", bearer(tokenPeserta(7)));

    expect(res.status).toBe(204);
    expect(jurnalService.hapusJurnal).toHaveBeenCalledWith(1, 7, "peserta");
  });

  it("h. PATCH /jurnal/1/review sebagai peserta: 403 dan service tidak dipanggil", async () => {
    const res = await request(app)
      .patch("/api/v1/jurnal/1/review")
      .set("Authorization", bearer(tokenPeserta()))
      .send({ statusReview: "sudah", catatan: "Mencoba me-review sendiri" });

    expect(res.status).toBe(403);
    expect(jurnalService.updateStatusReview).not.toHaveBeenCalled();
  });

  it("h. PATCH /jurnal/1/review sebagai mentor tanpa catatan padahal status 'sudah': 422 pada field catatan", async () => {
    const res = await request(app)
      .patch("/api/v1/jurnal/1/review")
      .set("Authorization", bearer(tokenMentor()))
      .send({ statusReview: "sudah" });

    expect(res.status).toBe(422);
    expect(res.body.error.detail.map((d: { field: string }) => d.field)).toContain("catatan");
    expect(jurnalService.updateStatusReview).not.toHaveBeenCalled();
  });

  it("PATCH /jurnal/1/review sebagai mentor dengan data benar: 200", async () => {
    jest.mocked(jurnalService.updateStatusReview).mockResolvedValue({ id: 1, statusReview: "sudah" } as never);

    const res = await request(app)
      .patch("/api/v1/jurnal/1/review")
      .set("Authorization", bearer(tokenMentor()))
      .send({ statusReview: "sudah", catatan: "Kerja bagus, lanjutkan" });

    expect(res.status).toBe(200);
    expect(jurnalService.updateStatusReview).toHaveBeenCalledWith(1, expect.objectContaining({ statusReview: "sudah" }));
  });
});

describe("/health dan X-Request-Id", () => {
  it("i. GET /health: 200", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("j. header X-Request-Id ada pada response sukses", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it.each<[string, () => request.Test, number]>([
    ["404", () => request(app).get("/api/v1/tidak-ada"), 404],
    ["401", () => request(app).get("/api/v1/me"), 401],
    ["422", () => request(app).get("/api/v1/peserta").query({ page: 0 }), 422],
    ["400", () => request(app).post("/api/v1/auth/login").set("Content-Type", "application/json").send("{rusak"), 400],
  ])("j. header X-Request-Id ada pada response error %s", async (_label, kirim, statusDiharapkan) => {
    const res = await kirim();

    expect(res.status).toBe(statusDiharapkan);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });

  it("request tanpa X-Request-Id mendapat id baru yang berbeda tiap request", async () => {
    const a = await request(app).get("/api/v1/health");
    const b = await request(app).get("/api/v1/health");

    expect(a.headers["x-request-id"]).not.toBe(b.headers["x-request-id"]);
  });
});