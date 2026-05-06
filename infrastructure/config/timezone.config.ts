import { DateTime, Settings } from 'luxon';
import { config } from 'dotenv';

config();

Settings.defaultZone = process.env.APP_TIMEZONE || 'America/Lima';

export { DateTime };