import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.DB_CONNECTION || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_DATABASE || 'postgres',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'super_secure_root_password',
  schema: process.env.DB_SCHEMA || 'public',
}));
