import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordRoleToPeserta1790660911429 implements MigrationInterface {
    name = 'AddPasswordRoleToPeserta1790660911429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "peserta" ADD "password" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "peserta" ADD "role" character varying NOT NULL DEFAULT 'peserta'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "peserta" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "peserta" DROP COLUMN "password"`);
    }

}
