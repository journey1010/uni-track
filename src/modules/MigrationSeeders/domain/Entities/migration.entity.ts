import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('migration_seeders')
export class Migration {
    
    @PrimaryGeneratedColumn({ type: "bigint"})
    id: number;

    @Column({ type: "varchar"})
    name: string;
    
    @Column({ type: "timestamp"})
    created_at: Date
}