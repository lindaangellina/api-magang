// Penerjemahan error database di errorHandler (kode PostgreSQL menjadi status HTTP).
import request from "supertest";
import { QueryFailedError } from "typeorm";
import app from "../../src/app";
import { bearer, tokenMentor } from "../helpers/token";
import { resetMockServices } from "../helpers/mockServices";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());
import * as services from "../../src/services";
import { jurnalService } from "../../src/services";

beforeEach(() => resetMockServices(services as unknown as Record<string, unknown>));

const errorPg = (code: string) =>
  new QueryFailedError("SELECT 1", [], Object.assign(new Error("error dari database"), { code }));

describe("errorHandler: error PostgreSQL", () => {
  it.each([
    ["23505 (UNIQUE dilanggar)", "23505", 409, "CONFLICT"],
    ["23503 (FOREIGN KEY dilanggar)", "23503", 409, "CONFLICT"],
    ["22P02 (format nilai tidak valid)", "22P02", 400, "VALIDATION_ERROR"],
  ])("%s menjadi %i %s", async (_label, kodePg, status, kode) => {
    jest.mocked(jurnalService.daftarJurnal).mockRejectedValue(errorPg(kodePg));

    const res = await request(app).get("/api/v1/jurnal").set("Authorization", bearer(tokenMentor()));

    expect(res.status).toBe(status);
    expect(res.body.error.kode).toBe(kode);
  });

  it("kode PostgreSQL lain tetap 500 dan tidak membocorkan pesan database", async () => {
    jest.mocked(jurnalService.daftarJurnal).mockRejectedValue(errorPg("42P01"));

    const res = await request(app).get("/api/v1/jurnal").set("Authorization", bearer(tokenMentor()));

    expect(res.status).toBe(500);
    expect(res.body.error.pesan).toBe("Terjadi kesalahan di server");
  });
});