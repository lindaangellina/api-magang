// SOAL 6: jebakan test async.
// Service palsu yang RUSAK: seharusnya melempar NotFoundError, tapi malah mengembalikan data.
class NotFoundError extends Error {}

const serviceRusak = {
  async getById(id: number) {
    return { id }; // bug: tidak pernah melempar NotFoundError
  },
};

const serviceBenar = {
  async getById(id: number): Promise<{ id: number }> {
    if (id === 99) throw new NotFoundError("Peserta tidak ditemukan");
    return { id };
  },
};

describe("jebakan async", () => {
  // ❌ VERSI SALAH 1 (tanpa await) sengaja dijadikan komentar, karena menjalankannya
  // menjatuhkan worker Jest 30 (assertion gagal SETELAH test dianggap selesai):
  //
  //   it("[SALAH, tanpa await]", () => {
  //     expect(serviceRusak.getById(99)).rejects.toThrow(NotFoundError);
  //   });
  //
  // Test di atas dianggap selesai tanpa menunggu assertion, jadi hasil test tidak bisa dipercaya.

  // ❌ VERSI SALAH 2 (try/catch tanpa expect.assertions): LOLOS walau service rusak,
  // karena catch tidak pernah dijalankan sehingga tidak ada satu pun assertion yang berjalan.
  it("[SALAH, try/catch tanpa expect.assertions] lolos walau service rusak", async () => {
    try {
      await serviceRusak.getById(99);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
    }
  });

  // ✅ VERSI BENAR terhadap service yang benar
  it("[BENAR] melempar NotFoundError jika peserta tidak ditemukan", async () => {
    expect.assertions(1);
    await expect(serviceBenar.getById(99)).rejects.toThrow(NotFoundError);
  });

  // ✅ Bukti versi benar menangkap bug: assertion yang sama dijalankan terhadap service rusak,
  // lalu dibungkus assertion luar yang menyatakan "bagian dalam ini HARUS gagal".
  // (Sengaja tidak memakai it.failing: it.failing tidak ikut membalik expect.assertions.)
  it("[BENAR] terhadap service rusak, assertion versi benar memang gagal", async () => {
    await expect(
      expect(serviceRusak.getById(99)).rejects.toThrow(NotFoundError)
    ).rejects.toThrow();
  });
});