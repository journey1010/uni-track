import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1777908222122 implements MigrationInterface {
    name = 'InitialSchema1777908222122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "display_name" character varying, "description" character varying, "code" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "display_name" character varying, "description" character varying, "code" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "last_name" character varying NOT NULL, "dni" character(8) NOT NULL, "phone" character varying, "email" character varying NOT NULL, "email_verified_at" TIMESTAMP, "status" smallint NOT NULL, "level" smallint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5fe9cfa518b76c96518a206b350" UNIQUE ("dni"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permission_role" ("role_id" bigint NOT NULL, "permission_id" bigint NOT NULL, CONSTRAINT "PK_559155e68c73c7b70d216b3e2e9" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_693f65986d1bd7b5bc973e30d7" ON "permission_role" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ea144050277434b1ec4a307061" ON "permission_role" ("permission_id") `);
        await queryRunner.query(`CREATE TABLE "role_user" ("user_id" bigint NOT NULL, "role_id" bigint NOT NULL, CONSTRAINT "PK_0d02ac0493a7a8193048bbc7da5" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5261e26da61ccaf8aeda8bca8e" ON "role_user" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_78ee37f2db349d230d502b1c7e" ON "role_user" ("role_id") `);
        await queryRunner.query(`CREATE TABLE "permission_user" ("user_id" bigint NOT NULL, "permission_id" bigint NOT NULL, CONSTRAINT "PK_71f93539441dda3fb6b568b8407" PRIMARY KEY ("user_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7a1e52a7e131004fc27275c915" ON "permission_user" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b7f01788089df44efe7bbcf68" ON "permission_user" ("permission_id") `);
        await queryRunner.query(`ALTER TABLE "permission_role" ADD CONSTRAINT "FK_693f65986d1bd7b5bc973e30d76" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "permission_role" ADD CONSTRAINT "FK_ea144050277434b1ec4a3070614" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_user" ADD CONSTRAINT "FK_5261e26da61ccaf8aeda8bca8ea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_user" ADD CONSTRAINT "FK_78ee37f2db349d230d502b1c7ea" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "permission_user" ADD CONSTRAINT "FK_7a1e52a7e131004fc27275c915d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "permission_user" ADD CONSTRAINT "FK_8b7f01788089df44efe7bbcf68d" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permission_user" DROP CONSTRAINT "FK_8b7f01788089df44efe7bbcf68d"`);
        await queryRunner.query(`ALTER TABLE "permission_user" DROP CONSTRAINT "FK_7a1e52a7e131004fc27275c915d"`);
        await queryRunner.query(`ALTER TABLE "role_user" DROP CONSTRAINT "FK_78ee37f2db349d230d502b1c7ea"`);
        await queryRunner.query(`ALTER TABLE "role_user" DROP CONSTRAINT "FK_5261e26da61ccaf8aeda8bca8ea"`);
        await queryRunner.query(`ALTER TABLE "permission_role" DROP CONSTRAINT "FK_ea144050277434b1ec4a3070614"`);
        await queryRunner.query(`ALTER TABLE "permission_role" DROP CONSTRAINT "FK_693f65986d1bd7b5bc973e30d76"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b7f01788089df44efe7bbcf68"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a1e52a7e131004fc27275c915"`);
        await queryRunner.query(`DROP TABLE "permission_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78ee37f2db349d230d502b1c7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5261e26da61ccaf8aeda8bca8e"`);
        await queryRunner.query(`DROP TABLE "role_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ea144050277434b1ec4a307061"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_693f65986d1bd7b5bc973e30d7"`);
        await queryRunner.query(`DROP TABLE "permission_role"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
