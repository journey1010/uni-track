import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRoleUserTable1714195200004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "role_user",
            columns: [
                { name: "user_id", type: "bigint", isPrimary: true },
                { name: "role_id", type: "bigint", isPrimary: true },
                { name: "user_type", type: "varchar" }
            ],
            foreignKeys: [
                {
                    columnNames: ["role_id"],
                    referencedTableName: "roles",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE"
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("role_user");
    }
}
