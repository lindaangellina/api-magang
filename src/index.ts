import "reflect-metadata"; // WAJIB baris pertama, sebelum import lain

import app from "./app";
import { AppDataSource } from "./config/database.config";
import { config } from "./config/env.config";
import { getPesertaDenganJurnal, getJurnalDenganPeserta } from "./services/jurnal-relasi.service";

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Database terhubung");

    // --- sementara buat tes Soal 2 Kamis, bisa dihapus lagi nanti ---
    const peserta = await getPesertaDenganJurnal(1);
    console.log("Peserta + jurnal:", JSON.stringify(peserta, null, 2));

    const jurnal = await getJurnalDenganPeserta();
    console.log("Jurnal + nama peserta:", jurnal);
    // ----------------------------------------------------------------

    app.listen(config.app.port, () => {
      console.log(`Server berjalan di http://localhost:${config.app.port}`);
    });
  } catch (err) {
    console.error("Gagal konek database:", err);
    process.exit(1);
  }
}

bootstrap();