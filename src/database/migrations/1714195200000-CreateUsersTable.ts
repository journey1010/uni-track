import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1714195200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "users",
            columns: [
                { name: "id", type: "bigint", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                { name: "name", type: "varchar" },
                { name: "last_name", type: "varchar" },
                { name: "dni", type: "char", length: "8", isUnique: true },
                { name: "phone", type: "varchar", isNullable: true },
                { name: "email", type: "varchar", isUnique: true },
                { name: "email_verified_at", type: "timestamp", isNullable: true },
                { name: "created_at", type: "timestamp", default: "now()" },
                { name: "updated_at", type: "timestamp", default: "now()" },
                { name: "status", type: "smallint" },
                { name: "level", type: "smallint" }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
    }
}
