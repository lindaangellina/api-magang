// src/docs/components.ts
import { ErrorCode } from "../utils/errorCodes";
import { bungkusDaftar, bungkusSukses, contohError, ref, responsError } from "./helpers";

// Pola password dan telepon sama persis dengan DTO (sumber: auth.dto.ts, peserta.dto.ts)
const POLA_PASSWORD = "^(?=.*[A-Za-z])(?=.*\\d).+$";
const POLA_TELEPON = "^(\\+62|62|0)8[1-9][0-9]{6,10}$";

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Tempel access token dari POST /auth/login (tanpa kata Bearer).",
    },
  },

  parameters: {
    Page: {
      name: "page", in: "query", description: "Nomor halaman (mulai 1)",
      schema: { type: "integer", minimum: 1, maximum: 1000000, default: 1 },
    },
    Limit: {
      name: "limit", in: "query", description: "Jumlah data per halaman",
      schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
    Order: {
      name: "order", in: "query", description: "Arah pengurutan",
      schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" },
    },
    Q: {
      name: "q", in: "query", description: "Kata kunci pencarian",
      schema: { type: "string", maxLength: 100 },
    },
    IdPath: {
      name: "id", in: "path", required: true, description: "ID data",
      schema: { type: "integer", minimum: 1, maximum: 2147483647 },
    },
  },

  headers: {
    XRequestId: {
      description: "ID unik request, gunakan saat melapor error agar mudah dilacak di log",
      schema: { type: "string", format: "uuid" },
    },
  },

  schemas: {
    PaginationMeta: {
      type: "object",
      properties: {
        page: { type: "integer", example: 1 },
        limit: { type: "integer", example: 10 },
        total: { type: "integer", example: 42 },
        totalPages: { type: "integer", example: 5 },
        hasNext: { type: "boolean", example: true },
        hasPrev: { type: "boolean", example: false },
      },
    },

    FieldError: {
      type: "object",
      properties: {
        field: {
          type: "string", example: "email",
          description: "Nama field; notasi titik untuk objek bersarang (lampiran.1.url)",
        },
        pesan: { type: "string", example: "Format email tidak valid" },
      },
    },

    ErrorResponse: {
      type: "object",
      properties: {
        sukses: { type: "boolean", example: false },
        error: {
          type: "object",
          required: ["kode", "pesan"],
          properties: {
            // Diambil langsung dari kode aplikasi: otomatis sinkron dengan ErrorCode
            kode: { type: "string", enum: Object.values(ErrorCode) },
            pesan: { type: "string" },
            detail: { type: "array", items: ref("FieldError") },
          },
        },
        requestId: { type: "string", format: "uuid" },
      },
    },

    // ---------------- Peserta ----------------
    Peserta: {
      type: "object",
      properties: {
        id: { type: "integer", readOnly: true, example: 1 },
        nama: { type: "string", example: "Budi Santoso" },
        sekolah: { type: "string", example: "SMK 5 Malang" },
        email: { type: "string", format: "email", example: "budi@mail.com" },
        telepon: { type: "string", nullable: true, example: "081234567890" },
        fase: { type: "integer", minimum: 1, maximum: 5, example: 1 },
        status: { type: "string", enum: ["aktif", "berhenti", "lulus"] },
        role: { type: "string", enum: ["peserta", "mentor"] },
        createdAt: { type: "string", format: "date-time", readOnly: true },
        updatedAt: { type: "string", format: "date-time", readOnly: true },
      },
    },

    RegisterRequest: {
      type: "object",
      required: ["nama", "sekolah", "email", "password", "konfirmasiPassword"],
      additionalProperties: false, // setara forbidNonWhitelisted: properti asing ditolak
      properties: {
        nama: { type: "string", minLength: 3, maxLength: 100, example: "Budi Santoso" },
        sekolah: { type: "string", minLength: 3, maxLength: 100, example: "SMK 5 Malang" },
        email: {
          type: "string", format: "email", maxLength: 254, example: "budi@mail.com",
          description: "Dinormalkan: spasi tepi dibuang, jadi huruf kecil",
        },
        password: {
          type: "string", format: "password", writeOnly: true,
          minLength: 8, maxLength: 72, pattern: POLA_PASSWORD,
          description: "Wajib mengandung huruf dan angka. Maksimal 72 karakter (batas bcrypt).",
        },
        konfirmasiPassword: {
          type: "string", format: "password", writeOnly: true,
          description: "Harus sama dengan password",
        },
      },
    },

    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      additionalProperties: false,
      properties: {
        email: { type: "string", format: "email", maxLength: 254, example: "budi@mail.com" },
        password: { type: "string", format: "password", writeOnly: true, maxLength: 72 },
      },
    },

    RefreshRequest: {
      type: "object",
      required: ["refreshToken"],
      additionalProperties: false,
      properties: {
        refreshToken: { type: "string", maxLength: 2048, description: "Refresh token dari POST /auth/login" },
      },
    },

    UpdateProfilRequest: {
      type: "object",
      additionalProperties: false, // email, role, password, id tidak boleh dikirim
      description: "Semua field opsional; kirim hanya yang ingin diubah.",
      properties: {
        nama: { type: "string", minLength: 3, maxLength: 100 },
        sekolah: { type: "string", minLength: 3, maxLength: 100 },
        telepon: { type: "string", pattern: POLA_TELEPON, example: "081234567890" },
      },
    },

    CreatePesertaRequest: {
      type: "object",
      required: ["nama", "sekolah", "email"],
      additionalProperties: false, // role, status, fase, password, id tidak boleh dikirim
      properties: {
        nama: { type: "string", minLength: 3, maxLength: 100, example: "Sari Wulandari" },
        sekolah: { type: "string", minLength: 3, maxLength: 100, example: "SMK 2 Surabaya" },
        email: { type: "string", format: "email", maxLength: 254, example: "sari@mail.com" },
        telepon: { type: "string", pattern: POLA_TELEPON, example: "081234567890" },
      },
    },

    // ---------------- Jurnal ----------------
    Lampiran: {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string", format: "uri", maxLength: 2048, example: "https://drive.google.com/file/d/abc123" },
        keterangan: { type: "string", maxLength: 200, example: "Screenshot hasil test" },
      },
    },

    Jurnal: {
      type: "object",
      properties: {
        id: { type: "integer", readOnly: true, example: 7 },
        pesertaId: { type: "integer", readOnly: true, example: 1 },
        kegiatan: { type: "string", example: "Belajar membuat dokumentasi API dengan Swagger" },
        hambatan: { type: "string", nullable: true, example: "Anotasi YAML masih sering salah indentasi" },
        linkCommit: { type: "string", format: "uri", nullable: true, example: "https://github.com/lindaangellina/api-magang/commit/abc1234" },
        statusReview: { type: "string", enum: ["belum", "sudah"] },
        reviewerId: { type: "integer", nullable: true, readOnly: true },
        catatanMentor: { type: "string", nullable: true, readOnly: true },
        lampiran: { type: "array", nullable: true, items: ref("Lampiran") },
        createdAt: { type: "string", format: "date-time", readOnly: true },
      },
    },

    CreateJurnalRequest: {
      type: "object",
      required: ["kegiatan"],
      additionalProperties: false, // pesertaId diambil dari token, bukan dari body
      properties: {
        kegiatan: { type: "string", minLength: 10, maxLength: 2000 },
        hambatan: { type: "string", maxLength: 2000 },
        linkCommit: { type: "string", format: "uri", maxLength: 2048 },
        lampiran: { type: "array", maxItems: 5, items: ref("Lampiran") },
      },
    },

    UpdateJurnalRequest: {
      type: "object",
      additionalProperties: false,
      description: "Semua field opsional; kirim hanya yang ingin diubah.",
      properties: {
        kegiatan: { type: "string", minLength: 10, maxLength: 2000 },
        hambatan: { type: "string", maxLength: 2000 },
        linkCommit: { type: "string", format: "uri", maxLength: 2048 },
      },
    },

    // ---------------- Pembungkus response sukses ----------------
    PesertaResponse: bungkusSukses(ref("Peserta")),
    PesertaListResponse: bungkusDaftar(ref("Peserta")),
    JurnalResponse: bungkusSukses(ref("Jurnal")),
    JurnalListResponse: bungkusDaftar(ref("Jurnal")),
    RefreshResponse: bungkusSukses({
      type: "object",
      properties: {
        accessToken: { type: "string", description: "Access token baru, berlaku 15 menit" },
      },
    }),
    // Response sukses tanpa data (mis. logout): data bernilai null
    MessageResponse: bungkusSukses({ type: "object", nullable: true, example: null }),
    // Jurnal milik saya memakai suksesDenganTotal: ada `total` di level atas, tanpa `meta`
    JurnalSayaResponse: {
      type: "object",
      properties: {
        sukses: { type: "boolean", example: true },
        pesan: { type: "string", example: "Jurnal milik saya berhasil diambil" },
        total: { type: "integer", example: 3 },
        data: { type: "array", items: ref("Jurnal") },
      },
    },
    PesertaJurnalResponse: bungkusSukses({
      type: "object",
      properties: {
        peserta: { type: "object", description: "Ringkasan peserta pemilik jurnal" },
        jurnal: { type: "array", items: ref("Jurnal") },
      },
    }),
    LoginResponse: bungkusSukses({
      type: "object",
      properties: {
        accessToken: { type: "string", description: "Berlaku 15 menit" },
        refreshToken: { type: "string", description: "Berlaku 7 hari, tukarkan di /auth/refresh" },
        peserta: ref("Peserta"),
      },
    }),
  },

  responses: {
    Unauthorized: responsError("Belum login, token tidak valid, atau token kedaluwarsa", {
      tokenHilang: { summary: "Token tidak dikirim", value: contohError("UNAUTHORIZED", "Silakan login terlebih dahulu") },
      tokenKedaluwarsa: { summary: "Access token kedaluwarsa", value: contohError("TOKEN_EXPIRED", "Token sudah kedaluwarsa") },
      tokenPalsu: { summary: "Token tidak valid", value: contohError("INVALID_TOKEN", "Token tidak valid") },
    }),

    Forbidden: responsError("Sudah login, tetapi tidak berhak melakukan aksi ini", {
      bukanMentor: { summary: "Aksi khusus mentor", value: contohError("FORBIDDEN", "Kamu tidak berhak melakukan aksi ini") },
    }),

    NotFound: responsError("Data tidak ditemukan", {
      peserta: { summary: "Peserta tidak ada", value: contohError("NOT_FOUND", "Peserta tidak ditemukan") },
    }),

    Conflict: responsError("Bentrok dengan data yang sudah ada", {
      duplikat: { summary: "Nilai unik sudah dipakai", value: contohError("CONFLICT", "Data dengan nilai yang sama sudah ada") },
    }),

    ValidationError: responsError("Input tidak lolos validasi (JSON rusak dikembalikan 400 INVALID_JSON)", {
      banyakField: {
        summary: "Beberapa field salah",
        value: contohError("VALIDATION_ERROR", "Validasi gagal", [
          { field: "email", pesan: "Format email tidak valid" },
          { field: "password", pesan: "Password minimal 8 karakter" },
        ]),
      },
      propertiAsing: {
        summary: "Properti yang tidak diizinkan (mass assignment)",
        value: contohError("VALIDATION_ERROR", "Validasi gagal", [
          { field: "role", pesan: "Properti ini tidak diizinkan" },
        ]),
      },
    }),

    PayloadTooLarge: responsError("Ukuran body request melebihi batas (1 MB)", {
      default: { summary: "Body terlalu besar", value: contohError("PAYLOAD_TOO_LARGE", "Ukuran request terlalu besar") },
    }),

    // Header di bawah ini sudah dibuktikan muncul lewat `curl -i` pada 429 (Soal 4).
    TooManyRequests: (() => {
      const dasar = responsError("Terlalu banyak percobaan (maksimal 10 login gagal per 15 menit per IP)", {
        default: { summary: "Rate limit terlampaui", value: contohError("RATE_LIMITED", "Terlalu banyak percobaan, coba lagi nanti") },
      });
      return {
        ...dasar,
        headers: {
          ...dasar.headers,
          "Retry-After": { description: "Detik sampai boleh mencoba lagi", schema: { type: "integer", example: 841 } },
          "RateLimit-Limit": { description: "Batas percobaan dalam satu jendela", schema: { type: "integer", example: 10 } },
          "RateLimit-Remaining": { description: "Sisa percobaan (0 saat terkena limit)", schema: { type: "integer", example: 0 } },
          "RateLimit-Reset": { description: "Detik sampai jendela direset", schema: { type: "integer", example: 841 } },
        },
      };
    })(),
  },
};