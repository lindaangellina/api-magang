// Kenapa kemampuan revert() penting di kerja tim?
// Kalau satu migration ternyata salah (misal tipe data keliru seperti contoh
// ini), tim tidak perlu masuk manual ke database dan mengutak-atik struktur
// tabel sendiri secara langsung — cukup jalankan migration:revert, dan
// perubahan yang salah otomatis dibatalkan sesuai apa yang ditulis di down().
// Ini juga memastikan semua anggota tim (dan environment lain seperti
// staging/production) bisa membatalkan perubahan yang sama persis dengan
// cara yang konsisten, tanpa risiko ada yang lupa langkah atau salah hapus
// kolom lain yang sebenarnya tidak berhubungan.

import { MigrationInterface, QueryRunner } from "typeorm";

export class ContohMigrationSalah1790216558690 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SENGAJA SALAH: skorMagang harusnya angka (0-100),
        // tapi di sini ditulis boolean (cuma true/false)
        await queryRunner.query(`ALTER TABLE "peserta" ADD "skorMagang" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "peserta" DROP COLUMN "skorMagang"`);
    }

}