import { potongTeks } from "../../../src/utils/teks";

describe("potongTeks", () => {
  it("tidak memotong teks yang tidak melebihi batas", () => {
    expect(potongTeks("halo", 10)).toBe("halo");
  });

  it("memotong dan menambah titik tiga jika melebihi batas", () => {
    expect(potongTeks("Belajar TypeScript", 10)).toBe("Belajar...");
  });

  // Kasus tepi + keputusan desain: hasil TIDAK PERNAH lebih panjang dari max
  it("teks yang panjangnya tepat sama dengan batas tidak dipotong", () => {
    expect(potongTeks("halo", 4)).toBe("halo");
  });

  it("teks kosong tetap kosong", () => {
    expect(potongTeks("", 5)).toBe("");
  });

  it("max kecil (2) menghasilkan titik sebanyak max, bukan melebihi batas", () => {
    expect(potongTeks("halo dunia", 2)).toBe("..");
  });

  it("max 3 menghasilkan tiga titik", () => {
    expect(potongTeks("halo dunia", 3)).toBe("...");
  });

  it("max 0 atau negatif menghasilkan string kosong", () => {
    expect(potongTeks("halo", 0)).toBe("");
    expect(potongTeks("halo", -5)).toBe("");
  });

  it.each(["halo dunia yang indah", "TypeScript", "a", ""])(
    "panjang hasil tidak pernah melebihi max untuk teks %p",
    (teks) => {
      for (const max of [0, 1, 2, 3, 4, 5, 10]) {
        expect(potongTeks(teks, max).length).toBeLessThanOrEqual(max);
      }
    }
  );
});