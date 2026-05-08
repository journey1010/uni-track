import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
    secret: process.env.JWT_SECRET || 'default_secret_change_me',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL || '3600', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL || '604800', 10),
    audience: process.env.APP_ENV || 'local',
}));
