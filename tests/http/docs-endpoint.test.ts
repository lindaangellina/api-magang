import request from "supertest";
import app from "../../src/app";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());

type Operasi = {
  tags?: string[];
  summary?: string;
  description?: string;
  security?: unknown[];
  responses?: Record<string, unknown>;
  parameters?: unknown[];
};

// [metode, path, endpoint publik?, kode respons yang wajib ada]
const ENDPOINT: [string, string, boolean, string[]][] = [
  ["post", "/auth/register", true, ["201", "409", "422"]],
  ["post", "/auth/login", true, ["200", "401", "422", "429"]],
  ["post", "/auth/refresh", true, ["200", "401", "422"]],
  ["post", "/auth/logout", true, ["200", "422"]],
  ["get", "/peserta", true, ["200", "422"]],
  ["post", "/peserta", true, ["201", "409", "422"]],
  ["get", "/peserta/{id}", true, ["200", "404", "422"]],
  ["patch", "/peserta/{id}", false, ["200", "401", "403", "404", "422"]],
  ["delete", "/peserta/{id}", false, ["204", "401", "403", "404", "409", "422"]],
  ["get", "/peserta/{id}/jurnal", true, ["200", "404", "422"]],
  ["get", "/me", false, ["200", "401"]],
  ["patch", "/me", false, ["200", "401", "422"]],
  ["get", "/me/jurnal", false, ["200", "401"]],
];

async function ambilSpec() {
  const res = await request(app).get("/api/docs.json");
  return res.body as { paths: Record<string, Record<string, Operasi>>; [k: string]: unknown };
}

describe("Dokumentasi endpoint Auth dan Peserta", () => {
  it.each(ENDPOINT)("%s %s: lengkap (tags, summary, description, respons wajib)", async (metode, path, _publik, kode) => {
    const spec = await ambilSpec();
    const op = spec.paths[path]?.[metode];

    expect(op).toBeDefined();
    expect(op.tags?.length).toBeGreaterThan(0);
    expect(op.summary).toBeTruthy();
    expect(op.description ?? op.summary).toBeTruthy();
    expect(Object.keys(op.responses ?? {})).toEqual(expect.arrayContaining(kode));
  });

  it.each(ENDPOINT)("%s %s: keamanan sesuai (publik = [], lainnya terkunci default)", async (metode, path, publik) => {
    const spec = await ambilSpec();
    const op = spec.paths[path][metode];

    if (publik) expect(op.security).toEqual([]);
    else expect(op.security).toBeUndefined(); // mewarisi bearerAuth dari level dokumen
  });

  it("path dengan {id} memakai parameter IdPath", async () => {
    const spec = await ambilSpec();
    for (const metode of ["get", "patch", "delete"]) {
      expect(JSON.stringify(spec.paths["/peserta/{id}"][metode].parameters)).toContain("#/components/parameters/IdPath");
    }
  });

  it("semua $ref di seluruh dokumen menunjuk ke komponen yang ada", async () => {
    const spec = await ambilSpec();
    const rujukan = [...JSON.stringify(spec).matchAll(/"\$ref":"#\/components\/(\w+)\/(\w+)"/g)];

    expect(rujukan.length).toBeGreaterThan(10);
    for (const [, jenis, nama] of rujukan) {
      expect((spec.components as Record<string, Record<string, unknown>>)[jenis]).toHaveProperty(nama);
    }
  });

  it("429 mendokumentasikan header yang terbukti muncul (Retry-After dan RateLimit-*)", async () => {
    const spec = await ambilSpec();
    const headers = (spec.components as { responses: Record<string, { headers: Record<string, unknown> }> })
      .responses.TooManyRequests.headers;

    expect(Object.keys(headers)).toEqual(
      expect.arrayContaining(["X-Request-Id", "Retry-After", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"])
    );
  });
});