import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateModels1783000057912 implements MigrationInterface {
  name = 'CreateModels1783000057912';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "models" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_ef9ed7160ea69013636466bf2d5" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_2fa3da3e3ed8f1379f8e29ebf49" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_04615a558292d5f284fa7e73bfb" DEFAULT getdate(), "created_by" varchar(100) NOT NULL, "name" varchar(255) NOT NULL, CONSTRAINT "PK_ef9ed7160ea69013636466bf2d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_18d8646b59304dce4af3a9e35b6" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_5f657f45753e2ab552e6cf09c3e" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_894cae7674f3b507d73a585575c" DEFAULT getdate(), "created_by" varchar(100) NOT NULL, "license_plate" varchar(10) NOT NULL, "chassis" varchar(30) NOT NULL, "renavam" nvarchar(255) NOT NULL, "year" int NOT NULL, "model_id" uniqueidentifier NOT NULL, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7e9fab2e8625b63613f67bd706" ON "vehicles" ("license_plate") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7c6681b16862bd33fcf1198444" ON "vehicles" ("chassis") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f20513b1dd64f0b2da6f91ef54" ON "vehicles" ("renavam") `,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c4fe98a2147b08df1ab56df5313" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c4fe98a2147b08df1ab56df5313"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_f20513b1dd64f0b2da6f91ef54" ON "vehicles"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_7c6681b16862bd33fcf1198444" ON "vehicles"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_7e9fab2e8625b63613f67bd706" ON "vehicles"`,
    );
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP TABLE "models"`);
  }
}
