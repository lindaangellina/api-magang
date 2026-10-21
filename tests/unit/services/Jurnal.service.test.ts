import { Repository } from "typeorm";
import { JurnalHarian } from "../../../src/entities/Jurnal.entity";
import { Peserta } from "../../../src/entities/Peserta.entity";
import { JurnalService } from "../../../src/services/jurnal.service";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../src/utils/AppError";
import { buatMockRepo, MockRepo } from "../../helpers/mockRepo";

describe("JurnalService", () => {
  let jurnalRepo: MockRepo;
  let pesertaRepo: MockRepo;
  let service: JurnalService;

  // Jurnal milik peserta nomor 7
  const jurnalMilik7 = () => ({ id: 10, pesertaId: 7, kegiatan: "Kegiatan lama yang cukup panjang", statusReview: "belum" });

  beforeEach(() => {
    jurnalRepo = buatMockRepo();
    pesertaRepo = buatMockRepo();
    // save mengembalikan apa yang diterimanya, merge menempelkan perubahan ke objek
    jurnalRepo.save.mockImplementation(async (j: object) => j);
    jurnalRepo.merge.mockImplementation((target: object, sumber: object) => Object.assign(target, sumber));
    service = new JurnalService(
      jurnalRepo as unknown as Repository<JurnalHarian>,
      pesertaRepo as unknown as Repository<Peserta>
    );
  });

  describe("updateJurnal: kepemilikan", () => {
    it("peserta TIDAK bisa mengubah jurnal milik peserta lain (ForbiddenError) dan tidak menyimpan", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      await expect(
        service.updateJurnal(10, 8, "peserta", { kegiatan: "Mencoba mengubah jurnal orang lain" })
      ).rejects.toThrow(ForbiddenError);
      expect(jurnalRepo.save).not.toHaveBeenCalled();
    });

    it("pemilik boleh mengubah jurnalnya sendiri", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      const hasil = await service.updateJurnal(10, 7, "peserta", { kegiatan: "Kegiatan yang sudah diperbarui" });

      expect(hasil.kegiatan).toBe("Kegiatan yang sudah diperbarui");
    });

    it("mentor boleh mengubah jurnal milik siapa pun", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      const hasil = await service.updateJurnal(10, 99, "mentor", { hambatan: "Dicatat oleh mentor" });

      expect(hasil.hambatan).toBe("Dicatat oleh mentor");
    });

    it("melempar NotFoundError jika jurnal tidak ditemukan", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateJurnal(404, 7, "peserta", { kegiatan: "Kegiatan yang cukup panjang" })
      ).rejects.toThrow(NotFoundError);
    });

    it("melempar ValidationError jika tidak ada field yang diisi", async () => {
      await expect(service.updateJurnal(10, 7, "peserta", {})).rejects.toThrow(ValidationError);
      expect(jurnalRepo.save).not.toHaveBeenCalled();
    });

    it("tidak mengubah pesertaId walau pemanggil mencoba menyelipkannya", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());
      const nakal = { kegiatan: "Kegiatan yang cukup panjang", pesertaId: 99 } as never;

      const hasil = await service.updateJurnal(10, 7, "peserta", nakal);

      expect(hasil.pesertaId).toBe(7);
    });
  });

  describe("updateStatusReview", () => {
    it("mentor dapat me-review jurnal milik siapa pun (service tidak membatasi pemilik)", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      const hasil = await service.updateStatusReview(10, { statusReview: "sudah", catatan: "Kerja bagus, lanjutkan" });

      expect(hasil).toMatchObject({ statusReview: "sudah", catatanMentor: "Kerja bagus, lanjutkan" });
    });

    it("mengembalikan ke 'belum' mengosongkan catatan mentor", async () => {
      jurnalRepo.findOneBy.mockResolvedValue({ ...jurnalMilik7(), statusReview: "sudah", catatanMentor: "Catatan lama" });

      const hasil = await service.updateStatusReview(10, { statusReview: "belum" });

      expect(hasil).toMatchObject({ statusReview: "belum", catatanMentor: null });
    });

    it("catatan yang diselipkan saat status 'belum' tidak pernah tersimpan", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      const hasil = await service.updateStatusReview(10, { statusReview: "belum", catatan: "Tidak boleh tersimpan" });

      expect(hasil.catatanMentor).toBeNull();
    });

    it("melempar NotFoundError jika jurnal tidak ditemukan", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateStatusReview(404, { statusReview: "sudah", catatan: "Catatan yang cukup" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("hapusJurnal", () => {
    it("peserta TIDAK bisa menghapus jurnal milik peserta lain, dan tidak ada yang terhapus", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      await expect(service.hapusJurnal(10, 8, "peserta")).rejects.toThrow(ForbiddenError);
      expect(jurnalRepo.delete).not.toHaveBeenCalled();
    });

    it("pemilik boleh menghapus jurnalnya sendiri", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      await expect(service.hapusJurnal(10, 7, "peserta")).resolves.toBeUndefined();
      expect(jurnalRepo.delete).toHaveBeenCalledTimes(1);
    });

    it("mentor boleh menghapus jurnal milik siapa pun", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(jurnalMilik7());

      await expect(service.hapusJurnal(10, 99, "mentor")).resolves.toBeUndefined();
    });

    it("melempar NotFoundError jika jurnal tidak ditemukan", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(null);

      await expect(service.hapusJurnal(404, 7, "peserta")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getJurnalById dan getJurnalByPeserta", () => {
    it("getJurnalById melempar NotFoundError jika tidak ada", async () => {
      jurnalRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getJurnalById(404)).rejects.toThrow(NotFoundError);
    });

    it("getJurnalByPeserta melempar NotFoundError jika pesertanya tidak ada", async () => {
      pesertaRepo.findOne.mockResolvedValue(null);

      await expect(service.getJurnalByPeserta(404)).rejects.toThrow(NotFoundError);
    });

    it("getJurnalByPeserta mengembalikan nama peserta dan daftar jurnalnya", async () => {
      pesertaRepo.findOne.mockResolvedValue({ id: 7, nama: "Budi", jurnalList: [{ id: 10 }, { id: 11 }] });

      await expect(service.getJurnalByPeserta(7)).resolves.toEqual({
        peserta: "Budi",
        jurnal: [{ id: 10 }, { id: 11 }],
      });
    });
  });

  describe("buatJurnal", () => {
    it("memakai pesertaId dari argumen (token), status awal 'belum', dan memetakan lampiran menjadi objek biasa", async () => {
      jurnalRepo.create.mockImplementation((d: object) => d);

      const hasil = await service.buatJurnal(7, {
        kegiatan: "Belajar unit testing dengan Jest",
        lampiran: [{ url: "https://contoh.com/a.png", keterangan: "Screenshot" }],
      });

      expect(hasil).toMatchObject({ pesertaId: 7, statusReview: "belum" });
      expect(hasil.lampiran).toEqual([{ url: "https://contoh.com/a.png", keterangan: "Screenshot" }]);
    });
  });
});