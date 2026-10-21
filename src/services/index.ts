// Satu-satunya tempat "merakit" service dengan dependensi asli (repository dari database).
// Controller mengambil instance dari sini. Test TIDAK mengimpor file ini: test mengimpor
// class-nya langsung dan memberinya repository tiruan.
import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { RefreshToken } from "../entities/RefreshToken.entity";
import { PesertaAuthRepository } from "../repositories/peserta-auth.repository";
import { PesertaService } from "./peserta.service";
import { JurnalService } from "./jurnal.service";
import { AuthService } from "./auth.service";

const pesertaRepo = AppDataSource.getRepository(Peserta);

export const pesertaService = new PesertaService(pesertaRepo);
export const jurnalService = new JurnalService(AppDataSource.getRepository(JurnalHarian), pesertaRepo);
export const authService = new AuthService(
  new PesertaAuthRepository(pesertaRepo),
  AppDataSource.getRepository(RefreshToken)
);

// stats.service belum diubah menjadi class (di luar tugas hari ini)
export * as statsService from "./stats.service";