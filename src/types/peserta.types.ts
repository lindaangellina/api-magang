export interface Peserta {
  id: number;
  nama: string;
  sekolah: string;
  email: string;
  telepon?: string;
  fase: number;
  status: "aktif" | "lulus" | "berhenti";
}

export interface PesertaParams {
  id: string;
}

export interface PesertaQuery {
  sekolah?: string;
  fase?: string;
  limit?: string;
}

export interface PesertaBody {
  nama: string;
  sekolah: string;
  email: string;
  telepon?: string;
  fase?: number;
  status?: "aktif" | "lulus" | "berhenti";
}