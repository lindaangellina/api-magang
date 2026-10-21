import { Repository } from "typeorm";
import { Peserta } from "../../../src/entities/Peserta.entity";
import { PesertaService } from "../../../src/services/peserta.service";
import { ConflictError, NotFoundError, ValidationError } from "../../../src/utils/AppError";
import { buatMockRepo, MockRepo } from "../../helpers/mockRepo";

describe("PesertaService", () => {
  let repo: MockRepo;
  let service: PesertaService;

  beforeEach(() => {
    repo = buatMockRepo();
    // Cast diperlukan karena mock kita bukan Repository sungguhan
    service = new PesertaService(repo as unknown as Repository<Peserta>);
  });

  describe("getPesertaById", () => {
    it("mengembalikan peserta jika ditemukan", async () => {
      const peserta = { id: 1, nama: "Budi" };
      repo.findOneBy.mockResolvedValue(peserta);

      await expect(service.getPesertaById(1)).resolves.toEqual(peserta);
    });

    it("melempar NotFoundError jika peserta tidak ada", async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.getPesertaById(99)).rejects.toThrow(NotFoundError);
    });
  });

  describe("daftarPeserta (pagination)", () => {
    const lq = { page: 3, limit: 10, sortBy: "createdAt", order: "DESC" as const };

    it("mengembalikan data dan total dari repository", async () => {
      const data = [{ id: 21 }, { id: 22 }];
      repo.findAndCount.mockResolvedValue([data, 25]);

      await expect(service.daftarPeserta(lq, {})).resolves.toEqual({ data, total: 25 });
    });

    it("menghitung halaman dengan benar: halaman 3 dengan limit 10 melewati 20 baris", async () => {
      repo.findAndCount.mockResolvedValue([[], 25]);

      await service.daftarPeserta(lq, {});

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });

    it("halaman pertama tidak melewati baris apa pun", async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.daftarPeserta({ ...lq, page: 1 }, {});

      expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it("kosong tetap mengembalikan array kosong dan total 0", async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await expect(service.daftarPeserta({ ...lq, page: 1 }, {})).resolves.toEqual({ data: [], total: 0 });
    });
  });

  describe("buatPeserta", () => {
    const data = { nama: "Budi", sekolah: "SMK 5 Malang", email: "budi@mail.com" };

    it("menyimpan peserta baru jika email belum dipakai", async () => {
      repo.findOneBy.mockResolvedValue(null);
      repo.create.mockReturnValue({ ...data });
      repo.save.mockResolvedValue({ id: 1, ...data });

      const hasil = await service.buatPeserta(data);

      expect(hasil).toMatchObject({ id: 1, email: "budi@mail.com" });
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it("melempar ConflictError dan TIDAK menyimpan jika email sudah terdaftar", async () => {
      repo.findOneBy.mockResolvedValue({ id: 5, email: data.email });

      await expect(service.buatPeserta(data)).rejects.toThrow(ConflictError);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("tidak pernah meneruskan role atau password ke data yang disimpan", async () => {
      repo.findOneBy.mockResolvedValue(null);
      repo.create.mockImplementation((d: object) => d);
      repo.save.mockImplementation(async (p: object) => p);
      // data nakal yang lolos tipe lewat cast: service harus tetap membuangnya
      const nakal = { ...data, role: "mentor", password: "x" } as unknown as typeof data;

      const hasil = await service.buatPeserta(nakal);

      expect(hasil).not.toHaveProperty("role");
      expect(hasil).not.toHaveProperty("password");
    });
  });

  describe("ubahProfil", () => {
    it("melempar NotFoundError jika peserta tidak ada", async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.ubahProfil(99, { nama: "Baru" })).rejects.toThrow(NotFoundError);
    });

    it("melempar ValidationError jika tidak ada field yang diisi, tanpa menyimpan", async () => {
      repo.findOneBy.mockResolvedValue({ id: 1, nama: "Budi" });

      await expect(service.ubahProfil(1, {})).rejects.toThrow(ValidationError);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("hanya mengubah field yang diisi dan menyimpan hasilnya", async () => {
      repo.findOneBy.mockResolvedValue({ id: 1, nama: "Budi", sekolah: "SMK 5" });
      repo.merge.mockImplementation((target: object, sumber: object) => Object.assign(target, sumber));
      repo.save.mockImplementation(async (p: object) => p);

      const hasil = await service.ubahProfil(1, { nama: "Budi Baru", sekolah: undefined });

      expect(hasil).toMatchObject({ nama: "Budi Baru", sekolah: "SMK 5" });
    });
  });

  describe("hapusPeserta", () => {
    it("berhasil jika ada baris yang terhapus", async () => {
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.hapusPeserta(1)).resolves.toBeUndefined();
    });

    it("melempar NotFoundError jika tidak ada yang terhapus", async () => {
      repo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.hapusPeserta(99)).rejects.toThrow(NotFoundError);
    });
  });
});