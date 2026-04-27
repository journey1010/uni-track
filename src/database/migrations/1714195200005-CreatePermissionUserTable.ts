import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePermissionUserTable1714195200005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "permission_user",
            columns: [
                { name: "user_id", type: "bigint", isPrimary: true },
                { name: "permission_id", type: "bigint", isPrimary: true },
                { name: "user_type", type: "varchar" }
            ],
            foreignKeys: [
                {
                    columnNames: ["permission_id"],
                    referencedTableName: "permissions",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE"
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("permission_user");
    }
}
