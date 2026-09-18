export interface Jurnal {
  id: number;
  pesertaId: number;
  kegiatan: string;
  status: "belum" | "selesai";
  direview: boolean;
  tanggal: string;
}

export interface JurnalParams {
  id: string;
}

export interface JurnalQuery {
  peserta?: string;
  status?: string;
}

export interface JurnalBody {
  pesertaId: number;
  kegiatan: string;
  status?: "belum" | "selesai";
}