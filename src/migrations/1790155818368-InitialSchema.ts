import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790155818368 implements MigrationInterface {
    name = 'InitialSchema1790155818368'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."peserta_status_enum" AS ENUM('aktif', 'lulus', 'berhenti')`);
        await queryRunner.query(`CREATE TABLE "peserta" ("id" SERIAL NOT NULL, "nama" character varying(100) NOT NULL, "sekolah" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "fase" integer NOT NULL DEFAULT '1', "status" "public"."peserta_status_enum" NOT NULL DEFAULT 'aktif', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b7eb9d43e42f96ccc613e992636" UNIQUE ("email"), CONSTRAINT "PK_cf6abc392067b3dff02667e1636" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."jurnal_harian_statusreview_enum" AS ENUM('belum', 'sudah')`);
        await queryRunner.query(`CREATE TABLE "jurnal_harian" ("id" SERIAL NOT NULL, "pesertaId" integer NOT NULL, "kegiatan" text NOT NULL, "hambatan" text, "linkCommit" character varying, "statusReview" "public"."jurnal_harian_statusreview_enum" NOT NULL DEFAULT 'belum', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7cacf478846a64b82515c9826b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mentor" ("id" SERIAL NOT NULL, "nama" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "keahlian" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e03cfa18e81812d44f5cdf94795" UNIQUE ("email"), CONSTRAINT "PK_9fcebd0a40237e9b6defcbd9d74" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "mentor"`);
        await queryRunner.query(`DROP TABLE "jurnal_harian"`);
        await queryRunner.query(`DROP TYPE "public"."jurnal_harian_statusreview_enum"`);
        await queryRunner.query(`DROP TABLE "peserta"`);
        await queryRunner.query(`DROP TYPE "public"."peserta_status_enum"`);
    }

}
