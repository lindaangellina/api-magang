import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses } from "../utils/response";
import { statsService } from "../services";

export const getStatistik = asyncHandler(async (req: Request, res: Response) => {
  const hasil = await statsService.getStatistik();
  sukses(res, hasil, "Statistik berhasil diambil");
});