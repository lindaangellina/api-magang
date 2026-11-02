import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../../src/app";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());

// Soal 6: setiap endpoint di tabel docs/endpoint-audit.md harus ada di dokumentasi Swagger.
function bacaEndpointAudit(): [string, string][] {
  const isi = fs.readFileSync(path.join(process.cwd(), "docs", "endpoint-audit.md"), "utf8");
  // Hanya tabel "Audit Versi Akhir" (sebelum bagian audit input), supaya baris gabungan tidak ikut
  const tabel = isi.split("## Audit Input")[0];
  const hasil: [string, string][] = [];
  for (const m of tabel.matchAll(/^\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|\s*(\/\S*)\s*\|/gm)) {
    hasil.push([m[1].toLowerCase(), m[2].replace(/:(\w+)/g, "{$1}")]);
  }
  return hasil;
}

describe("Kelengkapan dokumentasi terhadap endpoint-audit", () => {
  const endpoint = bacaEndpointAudit();

  it("tabel audit berhasil dibaca (minimal 20 endpoint)", () => {
    expect(endpoint.length).toBeGreaterThanOrEqual(20);
  });

  it("setiap endpoint di tabel audit ada di dokumen Swagger", async () => {
    const res = await request(app).get("/api/docs.json");
    const paths = res.body.paths as Record<string, Record<string, unknown>>;

    const hilang = endpoint
      .filter(([metode, p]) => !paths[p]?.[metode])
      .map(([metode, p]) => `${metode.toUpperCase()} ${p}`);

    expect(hilang).toEqual([]);
  });
});