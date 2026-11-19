// GET /me/jurnal dengan pagination (Minggu 19 Kamis): Express nyata + service di-mock.
import request from "supertest";
import app from "../../src/app";
import { bearer, tokenPeserta } from "../helpers/token";
import { resetMockServices } from "../helpers/mockServices";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());
import * as services from "../../src/services";
import { jurnalService } from "../../src/services";

beforeEach(() => resetMockServices(services as unknown as Record<string, unknown>));

const ambil = (url: string, id = 7) =>
  request(app).get(url).set("Authorization", bearer(tokenPeserta(id)));

describe("GET /me/jurnal", () => {
  it("401 tanpa token", async () => {
    const res = await request(app).get("/api/v1/me/jurnal");

    expect(res.status).toBe(401);
    expect(jurnalService.daftarJurnal).not.toHaveBeenCalled();
  });

  it("200 dengan data dan meta bawaan (halaman 1, limit 10)", async () => {
    jest.mocked(jurnalService.daftarJurnal).mockResolvedValue({ data: [{ id: 1 }], total: 1 } as never);

    const res = await ambil("/api/v1/me/jurnal");

    expect(res.status).toBe(200);
    expect(res.body.sukses).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false });
  });

  it("meta menghitung halaman tengah dengan benar (total 12, limit 5, halaman 2)", async () => {
    jest.mocked(jurnalService.daftarJurnal).mockResolvedValue({ data: [], total: 12 } as never);

    const res = await ambil("/api/v1/me/jurnal?page=2&limit=5");

    expect(res.body.meta).toEqual({ page: 2, limit: 5, total: 12, totalPages: 3, hasNext: true, hasPrev: true });
  });

  it("meneruskan page, limit, sortBy, order, dan pesertaId dari token ke service", async () => {
    jest.mocked(jurnalService.daftarJurnal).mockResolvedValue({ data: [], total: 0 } as never);

    await ambil("/api/v1/me/jurnal?page=3&limit=5&sortBy=statusReview&order=asc", 9);

    expect(jurnalService.daftarJurnal).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, limit: 5, sortBy: "statusReview", order: "ASC" }),
      { pesertaId: 9 }
    );
  });

  it("pesertaId di query diabaikan: yang dipakai tetap id dari token", async () => {
    jest.mocked(jurnalService.daftarJurnal).mockResolvedValue({ data: [], total: 0 } as never);

    const res = await ambil("/api/v1/me/jurnal?pesertaId=999", 7);

    expect(res.status).toBe(200);
    expect(jurnalService.daftarJurnal).toHaveBeenCalledWith(expect.anything(), { pesertaId: 7 });
  });

  it.each([
    ["page=0", "page"],
    ["limit=101", "limit"],
    ["sortBy=password", "sortBy"],
  ])("422 untuk %s", async (query, field) => {
    const res = await ambil(`/api/v1/me/jurnal?${query}`);

    expect(res.status).toBe(422);
    expect(res.body.error.kode).toBe("VALIDATION_ERROR");
    expect(res.body.error.detail.map((d: { field: string }) => d.field)).toContain(field);
    expect(jurnalService.daftarJurnal).not.toHaveBeenCalled();
  });
});
