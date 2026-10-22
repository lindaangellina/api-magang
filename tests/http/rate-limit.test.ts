// SOAL 4: test khusus rate limit login. File sendiri supaya penyimpanan hitungan limiter
// terpisah dari test lain (limiter dimatikan saat NODE_ENV=test, dinyalakan di sini).
import request from "supertest";
import app from "../../src/app";
import { UnauthorizedError } from "../../src/utils/AppError";
import { resetMockServices } from "../helpers/mockServices";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());
import * as services from "../../src/services";
import { authService } from "../../src/services";

describe("loginLimiter (aktif)", () => {
  const nodeEnvAsli = process.env.NODE_ENV;

  beforeAll(() => {
    // skip pada limiter dibaca saat request: selain "test", limiter menyala
    process.env.NODE_ENV = "development";
  });

  afterAll(() => {
    process.env.NODE_ENV = nodeEnvAsli;
  });

  beforeEach(() => resetMockServices(services as unknown as Record<string, unknown>));

  const kirimLogin = () =>
    request(app).post("/api/v1/auth/login").send({ email: "budi@mail.com", password: "apa-saja" });

  it("login yang BERHASIL tidak dihitung: 12 kali berhasil tidak kena 429", async () => {
    jest.mocked(authService.login).mockResolvedValue({
      accessToken: "ACCESS", refreshToken: "REFRESH", peserta: { id: 1, nama: "Budi", email: "budi@mail.com" },
    } as never);

    for (let i = 1; i <= 12; i++) {
      const res = await kirimLogin();
      expect(res.status).toBe(200);
    }
  });

  it("10 login gagal pertama 401, percobaan ke-11 menghasilkan 429 RATE_LIMITED", async () => {
    jest.mocked(authService.login).mockRejectedValue(new UnauthorizedError("Email atau password salah"));

    for (let i = 1; i <= 10; i++) {
      const res = await kirimLogin();
      expect(res.status).toBe(401);
    }

    const ke11 = await kirimLogin();
    expect(ke11.status).toBe(429);
    expect(ke11.body.error.kode).toBe("RATE_LIMITED");
    expect(ke11.headers["x-request-id"]).toBeDefined();
  });
});