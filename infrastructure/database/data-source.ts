import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { SeederOptions } from 'typeorm-extension';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { User } from '../../src/modules/users/domain/entities/user.entity';
import { Role } from '../../src/modules/authorization/domain/entities/role.entity';
import { Permission } from '../../src/modules/authorization/domain/entities/permission.entity';

config();

const options: DataSourceOptions & SeederOptions = {
  type: (process.env.DB_CONNECTION as 'postgres') || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_DATABASE || 'postgres',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'super_secure_root_password',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [User, Role, Permission],
  migrations: [join(process.cwd(), 'infrastructure/database/migrations/*{.ts,.js}')],
  seeds: [join(process.cwd(), 'infrastructure/database/seeders/MainSeeder.ts')],
  factories: [join(process.cwd(), 'infrastructure/database/factories/**/*{.ts,.js}')],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: process.env.APP_ENV === 'production' ? false : true,
};

export const AppDataSource = new DataSource(options);
