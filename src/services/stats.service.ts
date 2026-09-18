import { pesertaRepository, jurnalRepository } from "../repositories";

export function getStatistik() {
  const totalPeserta = pesertaRepository.count();
  const totalJurnal = jurnalRepository.count();
  const jurnalBelumDireview = jurnalRepository.findAll().filter((j) => !j.direview).length;
  const rataRataJurnalPerPeserta =
    totalPeserta > 0 ? Number((totalJurnal / totalPeserta).toFixed(2)) : 0;

  return { totalPeserta, totalJurnal, jurnalBelumDireview, rataRataJurnalPerPeserta };
}