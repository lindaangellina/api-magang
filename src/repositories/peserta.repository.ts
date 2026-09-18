import { BaseRepository } from "./base.repository";
import { Peserta } from "../types";
import { dataPeserta } from "../data/dummy";

class PesertaRepository extends BaseRepository<Peserta> {
  constructor() {
    super(dataPeserta);
  }
}

export const pesertaRepository = new PesertaRepository();