import { Peserta, Jurnal } from "../types";

export const dataPeserta: Peserta[] = [
  { id: 1, nama: "Linda", sekolah: "SMK5", fase: 1 },
  { id: 2, nama: "Zidan", sekolah: "SMK5", fase: 1 },
  { id: 3, nama: "Ajeng", sekolah: "SMK6", fase: 2 },
  { id: 4, nama: "Saida", sekolah: "SMK6", fase: 2 },
];

export const dataJurnal: Jurnal[] = [
  { id: 1, pesertaId: 1, kegiatan: "Belajar Express routing", status: "selesai", direview: true, tanggal: "2026-09-14" },
  { id: 2, pesertaId: 1, kegiatan: "Latihan query params", status: "belum", direview: false, tanggal: "2026-09-15" },
  { id: 3, pesertaId: 2, kegiatan: "Setup project Express", status: "selesai", direview: false, tanggal: "2026-09-14" },
  { id: 4, pesertaId: 3, kegiatan: "Belajar controller pattern", status: "belum", direview: false, tanggal: "2026-09-15" },
];