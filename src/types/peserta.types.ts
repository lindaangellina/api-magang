export interface Peserta {
  id: number;
  nama: string;
  sekolah: string;
  fase: number;
}

export interface PesertaParams {
  id: string; // route params selalu string
}

export interface PesertaQuery {
  sekolah?: string;
  fase?: string;
  limit?: string;
}

export interface PesertaBody {
  nama: string;
  sekolah: string;
  fase: number;
}