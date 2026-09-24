import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSkillManyToMany1790224616733 implements MigrationInterface {
    name = 'AddSkillManyToMany1790224616733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skill" ("id" SERIAL NOT NULL, "nama" character varying NOT NULL, CONSTRAINT "UQ_7d4d91ca881e76c879d5fc61c7d" UNIQUE ("nama"), CONSTRAINT "PK_a0d33334424e64fb78dc3ce7196" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "peserta_skill" ("pesertaId" integer NOT NULL, "skillId" integer NOT NULL, CONSTRAINT "PK_415095676405d696cdf5559c92d" PRIMARY KEY ("pesertaId", "skillId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6417588b7f7110b4cccbd40da9" ON "peserta_skill"  ("pesertaId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d34d80adf2e568840451f40f15" ON "peserta_skill"  ("skillId") `);
        await queryRunner.query(`ALTER TABLE "peserta_skill" ADD CONSTRAINT "FK_6417588b7f7110b4cccbd40da9e" FOREIGN KEY ("pesertaId") REFERENCES "peserta"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "peserta_skill" ADD CONSTRAINT "FK_d34d80adf2e568840451f40f15d" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "peserta_skill" DROP CONSTRAINT "FK_d34d80adf2e568840451f40f15d"`);
        await queryRunner.query(`ALTER TABLE "peserta_skill" DROP CONSTRAINT "FK_6417588b7f7110b4cccbd40da9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d34d80adf2e568840451f40f15"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6417588b7f7110b4cccbd40da9"`);
        await queryRunner.query(`DROP TABLE "peserta_skill"`);
        await queryRunner.query(`DROP TABLE "skill"`);
    }

}
