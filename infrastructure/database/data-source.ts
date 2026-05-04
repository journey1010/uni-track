import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

export const AppDataSource = new DataSource({
  type: (process.env.DB_CONNECTION as 'postgres') || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_DATABASE || 'postgres',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'super_secure_root_password',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [join(process.cwd(), 'src/modules/**/domain/entities/*.entity{.ts,.js}')],
  migrations: [join(process.cwd(), 'infrastructure/database/migrations/*{.ts,.js}')],
  synchronize: process.env.NODE_ENV === 'development' ? true : false,
} as any);

