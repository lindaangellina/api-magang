import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeleponToPeserta1790156320487 implements MigrationInterface {
    name = 'AddTeleponToPeserta1790156320487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "peserta" ADD "telepon" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "peserta" DROP COLUMN "telepon"`);
    }

}
