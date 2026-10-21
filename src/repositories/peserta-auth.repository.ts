import { DeepPartial, Repository } from "typeorm";
import { Peserta } from "../entities/Peserta.entity";

// Pembungkus tipis di atas Repository<Peserta> khusus kebutuhan auth (nama berbeda dari peserta.repository.ts yang sudah ada). Tujuannya: query yang rumit (seperti
// createQueryBuilder untuk login) hidup di SINI, sehingga service cukup memanggil satu method
// yang mudah di-mock. Query-nya sendiri diuji dengan database sungguhan di integration test.
export class PesertaAuthRepository {
  constructor(private readonly repo: Repository<Peserta>) {}

  cariByEmail(email: string): Promise<Peserta | null> {
    return this.repo.findOneBy({ email });
  }

  // Kolom password bersifat select:false, jadi harus diminta secara eksplisit (hanya untuk login)
  cariDenganPassword(email: string): Promise<Peserta | null> {
    return this.repo
      .createQueryBuilder("p")
      .addSelect("p.password")
      .where("p.email = :email", { email })
      .getOne();
  }

  buat(data: DeepPartial<Peserta>): Peserta {
    return this.repo.create(data);
  }

  simpan(peserta: Peserta): Promise<Peserta> {
    return this.repo.save(peserta);
  }
}