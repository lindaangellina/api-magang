import { cekPassword, hashPassword, tanpaPassword } from "../../../src/utils/password";

// bcrypt dipakai ASLI (bukan mock): ini fungsi murni dari pustaka yang sudah teruji,
// dan yang diuji di sini adalah pemakaian kita (hash tidak sama dengan teks asli, cek benar/salah).
describe("password", () => {
  it("hashPassword tidak mengembalikan teks asli", async () => {
    const hash = await hashPassword("rahasia123");

    expect(hash).not.toBe("rahasia123");
    expect(hash).toMatch(/^\$2[aby]\$/); // format bcrypt
  });

  it("password yang sama menghasilkan hash berbeda (salt acak)", async () => {
    const [a, b] = await Promise.all([hashPassword("rahasia123"), hashPassword("rahasia123")]);

    expect(a).not.toBe(b);
  });

  it("cekPassword true untuk password yang benar", async () => {
    const hash = await hashPassword("rahasia123");

    await expect(cekPassword("rahasia123", hash)).resolves.toBe(true);
  });

  it.each(["rahasia124", "RAHASIA123", " rahasia123", ""])("cekPassword false untuk %j", async (salah) => {
    const hash = await hashPassword("rahasia123");

    await expect(cekPassword(salah, hash)).resolves.toBe(false);
  });

  describe("tanpaPassword", () => {
    it("membuang password dan mempertahankan field lain", () => {
      const hasil = tanpaPassword({ id: 1, email: "a@mail.com", password: "HASH" });

      expect(hasil).toEqual({ id: 1, email: "a@mail.com" });
      expect(hasil).not.toHaveProperty("password");
    });

    it("tidak mengubah objek asli", () => {
      const asli = { id: 1, password: "HASH" };

      tanpaPassword(asli);

      expect(asli).toEqual({ id: 1, password: "HASH" });
    });
  });
});