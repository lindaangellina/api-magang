import { Request } from "express";

const BATAS_MAKS = 100;

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

export function parseListQuery(
  query: Request["query"],
  sortDiizinkan: readonly string[],
  sortBawaan: string = "createdAt"
): ListQuery {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    BATAS_MAKS,
    Math.max(1, parseInt(String(query.limit ?? "10"), 10) || 10)
  );
  const sortBy = sortDiizinkan.includes(String(query.sortBy))
    ? String(query.sortBy)
    : sortBawaan;
  const order = String(query.order).toUpperCase() === "ASC" ? "ASC" : "DESC";
  const q =
    typeof query.q === "string" && query.q.trim() !== "" ? query.q.trim() : undefined;

  return { page, limit, sortBy, order, q };
}

export function buatMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

export function escapeLike(teks: string): string {
  return teks.replace(/[\\%_]/g, "\\$&");
}