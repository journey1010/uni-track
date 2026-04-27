import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRolesTable1714195200002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "roles",
            columns: [
                { name: "id", type: "bigint", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                { name: "name", type: "varchar", isUnique: true },
                { name: "display_name", type: "varchar", isNullable: true },
                { name: "description", type: "varchar", isNullable: true },
                { name: "created_at", type: "timestamp", default: "now()" },
                { name: "updated_at", type: "timestamp", default: "now()" }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("roles");
    }
}
