import request from "supertest";
import type { Application } from "express";
import app from "../../src/app";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());

describe("Dokumentasi Swagger", () => {
  it("GET /api/docs.json: dokumen OpenAPI 3.0.3 dengan info, servers, tags, dan paths", async () => {
    const res = await request(app).get("/api/docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("API Magang Batch 4");
    expect(res.body.servers).toEqual([{ url: "/api/v1", description: "API v1" }]);
    expect(res.body.tags.map((t: { name: string }) => t.name)).toEqual(
      expect.arrayContaining(["Auth", "Profil", "Peserta", "Jurnal", "Sistem"])
    );
  });

  it("/health dan /health/ready terdokumentasi, /health/ready punya respons 200 dan 503", async () => {
    const res = await request(app).get("/api/docs.json");

    expect(res.body.paths["/health"].get.responses).toHaveProperty("200");
    expect(Object.keys(res.body.paths["/health/ready"].get.responses)).toEqual(["200", "503"]);
    // endpoint publik: security dikosongkan
    expect(res.body.paths["/health"].get.security).toEqual([]);
  });

  it("Selasa: bearerAuth terdaftar dan dokumen terkunci secara default", async () => {
    const res = await request(app).get("/api/docs.json");

    expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({ type: "http", scheme: "bearer", bearerFormat: "JWT" });
    expect(res.body.security).toEqual([{ bearerAuth: [] }]);
    expect(res.body.components.schemas.ErrorResponse.properties.error.properties.kode.enum).toContain("PAYLOAD_TOO_LARGE");
  });

  it("GET /api/docs/ menyajikan halaman Swagger UI", async () => {
    const res = await request(app).get("/api/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
  });

  it("CSP dimatikan hanya untuk rute docs; rute API lain tetap memakai CSP helmet", async () => {
    const docs = await request(app).get("/api/docs/");
    const health = await request(app).get("/api/v1/health");

    expect(docs.headers["content-security-policy"]).toBeUndefined();
    expect(health.headers["content-security-policy"]).toBeDefined();
  });

  it("DOCS_ENABLED=false mematikan dokumentasi (404)", async () => {
    process.env.DOCS_ENABLED = "false";
    let appMati!: Application;
    try {
      jest.isolateModules(() => {
        appMati = require("../../src/app").default;
      });
      const res = await request(appMati).get("/api/docs.json");

      expect(res.status).toBe(404);
    } finally {
      delete process.env.DOCS_ENABLED;
    }
  });
});