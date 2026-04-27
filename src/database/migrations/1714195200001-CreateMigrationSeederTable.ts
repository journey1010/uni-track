import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateMigrationSeederTable1714195200001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "migration_seeder",
            columns: [
                { name: "id", type: "bigint", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                { name: "seeder_name", type: "varchar" }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("migration_seeder");
    }
}
