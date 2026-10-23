// Express + PostgreSQL SUNGGUHAN (tanpa mock). Hanya alur terpenting, karena lebih lambat.
import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/database.config";
import { Peserta } from "../../src/entities/Peserta.entity";
import { bersihkanDatabase } from "../helpers/db";

describe("Alur autentikasi lengkap (database sungguhan)", () => {
  const akun = {
    nama: "Budi Santoso",
    sekolah: "SMK 5 Malang",
    email: "budi@mail.com",
    password: "rahasia123",
    konfirmasiPassword: "rahasia123",
  };

  beforeAll(async () => {
    await AppDataSource.initialize();
    // Menjalankan SEMUA migration dari nol: sekaligus membuktikan migration benar-benar
    // membangun skema yang dibutuhkan aplikasi.
    await AppDataSource.runMigrations();
  });

  beforeEach(async () => {
    await bersihkanDatabase();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("register, login, akses /me, tolak mass assignment, refresh, logout, refresh ditolak", async () => {
    // 1. Register
    const reg = await request(app).post("/api/v1/auth/register").send(akun);
    expect(reg.status).toBe(201);
    expect(reg.body.data).not.toHaveProperty("password");

    // 2. Login
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: akun.email, password: akun.password });
    expect(login.status).toBe(200);
    const { accessToken, refreshToken } = login.body.data;
    expect(accessToken).toEqual(expect.any(String));

    // 3. Akses profil sendiri
    const me = await request(app).get("/api/v1/me").set("Authorization", `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(akun.email);
    expect(me.body.data).not.toHaveProperty("password");

    // 4. Mass assignment ditolak DAN role di database tidak berubah
    const nakal = await request(app)
      .patch("/api/v1/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role: "mentor" });
    expect(nakal.status).toBe(422);
    const dariDb = await AppDataSource.getRepository(Peserta).findOneByOrFail({ email: akun.email });
    expect(dariDb.role).toBe("peserta");

    // 5. Refresh berhasil
    const refresh = await request(app).post("/api/v1/auth/refresh").send({ refreshToken });
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toEqual(expect.any(String));

    // 6. Logout, lalu refresh token yang sama harus ditolak
    const logout = await request(app).post("/api/v1/auth/logout").send({ refreshToken });
    expect([200, 204]).toContain(logout.status);

    const refreshLagi = await request(app).post("/api/v1/auth/refresh").send({ refreshToken });
    expect(refreshLagi.status).toBe(401);
  });

  it("menolak email duplikat walau beda huruf besar dan spasi (409)", async () => {
    await request(app).post("/api/v1/auth/register").send(akun);

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...akun, email: "  BUDI@mail.com " });

    expect(res.status).toBe(409);
    expect(res.body.error.kode).toBe("CONFLICT");
  });

  it("dua register bersamaan dengan email sama: satu 201, satu 409 (UNIQUE constraint)", async () => {
    const [a, b] = await Promise.all([
      request(app).post("/api/v1/auth/register").send(akun),
      request(app).post("/api/v1/auth/register").send(akun),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
  });
});