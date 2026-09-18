import { BaseRepository } from "./base.repository";
import { Jurnal } from "../types";
import { dataJurnal } from "../data/dummy";

class JurnalRepository extends BaseRepository<Jurnal> {
  constructor() {
    super(dataJurnal);
  }

  findByPesertaId(pesertaId: number): Jurnal[] {
    return this.data.filter((j) => j.pesertaId === pesertaId);
  }
}

export const jurnalRepository = new JurnalRepository();