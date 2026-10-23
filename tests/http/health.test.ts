import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/database.config";

jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());

describe("GET /health/ready", () => {
  afterEach(() => jest.restoreAllMocks());

  it("200 jika database menjawab", async () => {
    const query = jest.spyOn(AppDataSource, "query").mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/api/v1/health/ready");

    expect(res.status).toBe(200);
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  it("503 jika database tidak bisa dihubungi", async () => {
    jest.spyOn(AppDataSource, "query").mockRejectedValue(new Error("koneksi putus"));

    const res = await request(app).get("/api/v1/health/ready");

    expect(res.status).toBe(503);
  });
});