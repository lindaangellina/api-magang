import { buatMeta, escapeLike } from "../../../src/utils/pagination";

describe("buatMeta", () => {
  it("menghitung totalPages dengan pembulatan ke atas", () => {
    expect(buatMeta(1, 10, 25).totalPages).toBe(3);
  });

  it("halaman tengah punya hasNext dan hasPrev", () => {
    expect(buatMeta(2, 10, 25)).toEqual({
      page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true,
    });
  });

  it("halaman terakhir tidak punya hasNext", () => {
    expect(buatMeta(3, 10, 25).hasNext).toBe(false);
  });

  it("halaman pertama tidak punya hasPrev", () => {
    expect(buatMeta(1, 10, 25).hasPrev).toBe(false);
  });

  it("data kosong tetap menghasilkan 1 halaman", () => {
    const meta = buatMeta(1, 10, 0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });
});

describe("buatMeta: kasus tepi totalPages", () => {
  it.each([
    [1, 10, 0, 1],     // kosong tetap 1 halaman
    [1, 10, 1, 1],     // 1 data
    [1, 10, 10, 1],    // pas satu halaman penuh
    [1, 10, 11, 2],    // lebih satu dari penuh
    [1, 10, 100, 10],  // kelipatan pas
    [1, 10, 101, 11],  // kelipatan + 1
    [1, 1, 5, 5],      // limit 1
    [2, 5, 0, 1],      // page di luar jangkauan pada data kosong
  ])("buatMeta(%i, %i, %i) menghasilkan totalPages %i", (page, limit, total, diharapkan) => {
    expect(buatMeta(page, limit, total).totalPages).toBe(diharapkan);
  });
});

describe("escapeLike", () => {
  it("meng-escape wildcard persen", () => {
    expect(escapeLike("100%")).toBe("100\\%");
  });

  it("meng-escape wildcard underscore", () => {
    expect(escapeLike("a_b")).toBe("a\\_b");
  });

  it("meng-escape backslash", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("tidak mengubah teks biasa", () => {
    expect(escapeLike("budi santoso")).toBe("budi santoso");
  });
});