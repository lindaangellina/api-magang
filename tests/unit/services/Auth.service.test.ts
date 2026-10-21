import { Repository } from "typeorm";
import { RefreshToken } from "../../../src/entities/RefreshToken.entity";
import { PesertaAuthRepository } from "../../../src/repositories/peserta-auth.repository";
import { AuthService } from "../../../src/services/auth.service";
import { ConflictError, UnauthorizedError } from "../../../src/utils/AppError";
import { cekPassword, hashPassword } from "../../../src/utils/password";
import { buatAccessToken, buatRefreshToken, verifikasiRefreshToken } from "../../../src/utils/jwt";
import {
  buatMockPesertaAuthRepository,
  buatMockRepo,
  MockPesertaAuthRepository,
  MockRepo,
} from "../../helpers/mockRepo";

// Mock modul: hanya hashing dan JWT yang diganti. tanpaPassword (fungsi murni milik sendiri)
// tetap yang asli, karena fungsi murni tidak perlu di-mock.
jest.mock("../../../src/utils/password", () => ({
  ...jest.requireActual("../../../src/utils/password"),
  hashPassword: jest.fn(),
  cekPassword: jest.fn(),
}));
jest.mock("../../../src/utils/jwt", () => ({
  buatAccessToken: jest.fn(),
  buatRefreshToken: jest.fn(),
  verifikasiRefreshToken: jest.fn(),
}));

const mockHash = jest.mocked(hashPassword);
const mockCek = jest.mocked(cekPassword);
const mockBuatAccess = jest.mocked(buatAccessToken);
const mockBuatRefresh = jest.mocked(buatRefreshToken);
const mockVerifikasiRefresh = jest.mocked(verifikasiRefreshToken);

describe("AuthService", () => {
  let pesertaRepo: MockPesertaAuthRepository;
  let tokenRepo: MockRepo;
  let service: AuthService;

  beforeEach(() => {
    pesertaRepo = buatMockPesertaAuthRepository();
    tokenRepo = buatMockRepo();
    // Nilai bawaan dipasang ulang di setiap test supaya tidak ada yang bocor antar test
    mockHash.mockResolvedValue("HASH_PALSU");
    mockCek.mockResolvedValue(true);
    mockBuatAccess.mockReturnValue("ACCESS_PALSU");
    mockBuatRefresh.mockReturnValue("REFRESH_PALSU");
    mockVerifikasiRefresh.mockReturnValue({ id: 3, email: "budi@mail.com", role: "peserta" });
    tokenRepo.create.mockImplementation((d: object) => d);
    tokenRepo.save.mockImplementation(async (d: object) => d);
    service = new AuthService(
      pesertaRepo as unknown as PesertaAuthRepository,
      tokenRepo as unknown as Repository<RefreshToken>
    );
  });

  describe("register", () => {
    const input = { nama: "Budi", sekolah: "SMK 5 Malang", email: "budi@mail.com", password: "rahasia123" };

    beforeEach(() => {
      pesertaRepo.cariByEmail.mockResolvedValue(null);
      pesertaRepo.buat.mockImplementation((d: object) => ({ ...d }));
      pesertaRepo.simpan.mockImplementation(async (p: object) => ({ id: 1, ...p }));
    });

    it("a. email sudah ada: melempar ConflictError dan TIDAK menyimpan", async () => {
      pesertaRepo.cariByEmail.mockResolvedValue({ id: 5, email: input.email });

      await expect(service.register(input)).rejects.toThrow(ConflictError);
      expect(pesertaRepo.simpan).not.toHaveBeenCalled();
    });

    it("b. password yang disimpan adalah HASH, bukan password asli", async () => {
      await service.register(input);

      const disimpan = pesertaRepo.simpan.mock.calls[0][0];
      expect(disimpan.password).toBe("HASH_PALSU");
      expect(disimpan.password).not.toBe("rahasia123");
      expect(mockHash).toHaveBeenCalledWith("rahasia123");
    });

    it("c. hasil register tidak mengandung properti password", async () => {
      const hasil = await service.register(input);

      expect(hasil).not.toHaveProperty("password");
      expect(hasil).toMatchObject({ id: 1, email: "budi@mail.com" });
    });

    it("peserta baru selalu berperan 'peserta'", async () => {
      await service.register(input);

      expect(pesertaRepo.simpan.mock.calls[0][0].role).toBe("peserta");
    });
  });

  describe("login", () => {
    const akun = { id: 3, email: "budi@mail.com", role: "peserta", password: "HASH_DB" };

    it("d. email tidak ditemukan: melempar UnauthorizedError", async () => {
      pesertaRepo.cariDenganPassword.mockResolvedValue(null);

      await expect(service.login({ email: "tidak@ada.com", password: "apa-saja" })).rejects.toThrow(UnauthorizedError);
    });

    it("e. password salah: melempar UnauthorizedError dan tidak menerbitkan token", async () => {
      pesertaRepo.cariDenganPassword.mockResolvedValue(akun);
      mockCek.mockResolvedValue(false);

      await expect(service.login({ email: akun.email, password: "salah" })).rejects.toThrow(UnauthorizedError);
      expect(mockBuatAccess).not.toHaveBeenCalled();
      expect(tokenRepo.save).not.toHaveBeenCalled();
    });

    it("f. pesan error email tidak ada dan password salah SAMA persis", async () => {
      pesertaRepo.cariDenganPassword.mockResolvedValueOnce(null);
      const errEmail = await service.login({ email: "x@mail.com", password: "apa-saja" }).catch((e: Error) => e);

      pesertaRepo.cariDenganPassword.mockResolvedValueOnce(akun);
      mockCek.mockResolvedValueOnce(false);
      const errPassword = await service.login({ email: akun.email, password: "salah" }).catch((e: Error) => e);

      expect(errEmail).toBeInstanceOf(UnauthorizedError);
      expect(errPassword).toBeInstanceOf(UnauthorizedError);
      expect((errEmail as Error).message).toBe((errPassword as Error).message);
    });

    it("g. sukses: mengembalikan accessToken dan refreshToken, peserta tanpa password", async () => {
      pesertaRepo.cariDenganPassword.mockResolvedValue(akun);

      const hasil = await service.login({ email: akun.email, password: "benar" });

      expect(hasil.accessToken).toBe("ACCESS_PALSU");
      expect(hasil.refreshToken).toBe("REFRESH_PALSU");
      expect(hasil.peserta).not.toHaveProperty("password");
    });

    it("h. sukses: refresh token disimpan dengan expiresAt tepat 7 hari kemudian", async () => {
      pesertaRepo.cariDenganPassword.mockResolvedValue(akun);
      const waktu = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-10-19T00:00:00Z").getTime());

      try {
        await service.login({ email: akun.email, password: "benar" });
      } finally {
        waktu.mockRestore(); // kembalikan waktu asli, tanpa menyentuh spy console milik setupAfterEnv
      }

      expect(tokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ token: "REFRESH_PALSU", expiresAt: new Date("2026-10-26T00:00:00Z") })
      );
    });
  });

  describe("refresh dan logout", () => {
    it("i. refresh token tidak ada di database: melempar UnauthorizedError", async () => {
      mockVerifikasiRefresh.mockReturnValue({ id: 3, email: "budi@mail.com", role: "peserta" });
      tokenRepo.findOneBy.mockResolvedValue(null);

      await expect(service.refresh("token-yang-sudah-dicabut")).rejects.toThrow(UnauthorizedError);
      expect(mockBuatAccess).not.toHaveBeenCalled();
    });

    it("refresh token yang dikenali menghasilkan access token baru", async () => {
      mockVerifikasiRefresh.mockReturnValue({ id: 3, email: "budi@mail.com", role: "peserta" });
      tokenRepo.findOneBy.mockResolvedValue({ id: 1, token: "REFRESH_PALSU" });

      await expect(service.refresh("REFRESH_PALSU")).resolves.toEqual({ accessToken: "ACCESS_PALSU" });
    });

    it("refresh token yang tidak sah/kedaluwarsa (verifikasi melempar error) ditolak", async () => {
      mockVerifikasiRefresh.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      await expect(service.refresh("token-kedaluwarsa")).rejects.toThrow("jwt expired");
      expect(tokenRepo.findOneBy).not.toHaveBeenCalled();
    });

    it("j. logout menghapus refresh token yang dikirim", async () => {
      tokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.logout("REFRESH_PALSU");

      expect(tokenRepo.delete).toHaveBeenCalledWith({ token: "REFRESH_PALSU" });
    });
  });
});