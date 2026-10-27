// src/docs/helpers.ts
// Fungsi kecil agar components.ts tidak mengulang bentuk yang sama berkali-kali.

export const ref = (nama: string) => ({ $ref: `#/components/schemas/${nama}` });

// Bentuk response sukses: { sukses, pesan, data }
export const bungkusSukses = (data: object) => ({
  type: "object",
  properties: {
    sukses: { type: "boolean", example: true },
    pesan: { type: "string", example: "Berhasil" },
    data,
  },
});

// Bentuk response daftar: { sukses, pesan, data: [...], meta }
export const bungkusDaftar = (item: object) => ({
  type: "object",
  properties: {
    sukses: { type: "boolean", example: true },
    pesan: { type: "string", example: "Berhasil" },
    data: { type: "array", items: item },
    meta: ref("PaginationMeta"),
  },
});

// Contoh isi response error (dipakai di examples)
export const contohError = (kode: string, pesan: string, detail?: unknown) => ({
  sukses: false,
  error: { kode, pesan, ...(detail !== undefined && { detail }) },
  requestId: "b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10",
});

// Satu response error yang bisa dipakai ulang lewat $ref
export const responsError = (
  deskripsi: string,
  examples: Record<string, { summary: string; value: unknown }>
) => ({
  description: deskripsi,
  headers: { "X-Request-Id": { $ref: "#/components/headers/XRequestId" } },
  content: { "application/json": { schema: ref("ErrorResponse"), examples } },
});