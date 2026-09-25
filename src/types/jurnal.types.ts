export type StatusReview = "belum" | "sudah";

export interface Jurnal {
  id: number;
  pesertaId: number;
  kegiatan: string;
  hambatan?: string;
  linkCommit?: string;
  statusReview: StatusReview;
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
  hambatan?: string;
  linkCommit?: string;
  statusReview?: StatusReview;
}