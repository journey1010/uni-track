import { registerAs } from '@nestjs/config';

const DEFAULT_ACCESS_TTL = 900;
const DEFAULT_REFRESH_TTL = 86400;
const DEFAULT_THRESHOLD = 7200;

export default registerAs('jwt', () => {
    const toNumber = (value: string | undefined, fallback: number): number => {
        if (value === undefined) return fallback;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? fallback : parsed;
    };

    return {
        secret: process.env.JWT_SECRET || 'default_secret_change_me',
        accessTtl: toNumber(process.env.JWT_ACCESS_TTL, DEFAULT_ACCESS_TTL) || process.env.JWT_ACCESS_TTL,
        refreshTtl: toNumber(process.env.JWT_REFRESH_TTL, DEFAULT_REFRESH_TTL) || process.env.JWT_REFRESH_TTL,
        audience: process.env.APP_ENV || 'local',
    };
});