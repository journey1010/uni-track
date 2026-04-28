import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'local',
  port: parseInt(process.env.PORT || '3000', 10),
}));
