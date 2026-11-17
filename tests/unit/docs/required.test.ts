import { components } from "../../../src/docs/components";
import { bungkusSukses, bungkusDaftar } from "../../../src/docs/helpers";

// Minggu 19 Selasa: `required` menentukan apakah generator tipe frontend membuat properti
// wajib (`id: number`) atau opsional (`id?: number`). Test ini menjaga agar kontrak tidak kembali longgar.

interface Skema {
  type?: string;
  required?: string[];
  properties?: Record<string, Skema & { nullable?: boolean }>;
  items?: Skema;
}
const schemas = components.schemas as unknown as Record<string, Skema>;

// Pastikan setiap nama di `required` benar-benar ada di `properties` (cegah salah ketik)
function periksa(nama: string, skema: Skema): void {
  const wajib = skema.required ?? [];
  const properti = Object.keys(skema.properties ?? {});
  for (const k of wajib) {
    expect({ schema: nama, properti: k, ada: properti.includes(k) }).toEqual({ schema: nama, properti: k, ada: true });
  }
}

describe("Dokumen OpenAPI: required", () => {
  const WAJIB: Record<string, string[]> = {
    PaginationMeta: ["page", "limit", "total", "totalPages", "hasNext", "hasPrev"],
    FieldError: ["field", "pesan"],
    ErrorResponse: ["sukses", "error"],
    Peserta: ["id", "nama", "sekolah", "email", "fase", "status", "role", "createdAt"],
    Jurnal: ["id", "pesertaId", "kegiatan", "statusReview", "createdAt"],
    Lampiran: ["url"],
    JurnalSayaResponse: ["sukses", "pesan", "total", "data"],
  };

  it.each(Object.entries(WAJIB))("%s mewajibkan properti yang selalu ada", (nama, daftar) => {
    expect(schemas[nama].required).toEqual(expect.arrayContaining(daftar));
  });

  it("setiap nama di required ada di properties (semua schema)", () => {
    for (const [nama, skema] of Object.entries(schemas)) {
      if (skema.required) periksa(nama, skema);
    }
  });

  it("pembungkus response memakai required", () => {
    expect(bungkusSukses({}).required).toEqual(["sukses", "pesan", "data"]);
    expect(bungkusDaftar({}).required).toEqual(["sukses", "pesan", "data", "meta"]);
  });

  it("properti yang boleh null atau tidak dikirim TIDAK wajib di Jurnal", () => {
    const wajib = schemas.Jurnal.required ?? [];
    for (const k of ["hambatan", "linkCommit", "reviewerId", "catatanMentor", "lampiran"]) {
      expect(wajib).not.toContain(k);
    }
  });

  it("response bungkus (LoginResponse, StatsResponse, dst.) mewajibkan isi data", () => {
    for (const nama of ["PesertaResponse", "JurnalResponse", "JurnalListResponse", "LoginResponse", "StatsResponse", "RefreshResponse", "MessageResponse"]) {
      expect(schemas[nama].required).toEqual(expect.arrayContaining(["sukses", "pesan", "data"]));
    }
    const login = schemas.LoginResponse.properties?.data as Skema;
    expect(login.required).toEqual(["accessToken", "refreshToken", "peserta"]);
  });
});
