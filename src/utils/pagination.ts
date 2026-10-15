// parseListQuery (Minggu 13) sudah dihapus: validasi query kini dilakukan DTO
// (ListQueryDto dan turunannya di src/dto). File ini tinggal tipe dan helper.

export interface ListQuery {
  page: number;
  limit: number;
  sortBy: string;
  order: "ASC" | "DESC";
  q?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buatMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

export function escapeLike(teks: string): string {
  return teks.replace(/[\\%_]/g, "\\$&");
}