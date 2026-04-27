import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePermissionRoleTable1714195200006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "permission_role",
            columns: [
                { name: "permission_id", type: "bigint", isPrimary: true },
                { name: "role_id", type: "bigint", isPrimary: true }
            ],
            foreignKeys: [
                {
                    columnNames: ["permission_id"],
                    referencedTableName: "permissions",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE"
                },
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
        await queryRunner.dropTable("permission_role");
    }
}
