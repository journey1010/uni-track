import { config } from 'dotenv';

config();

export const hashingConfig = {
  driver: process.env.HASH_DRIVER || 'bcrypt',

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  argon: {
    memory: parseInt(process.env.ARGON_MEMORY || '65536', 10),
    threads: parseInt(process.env.ARGON_THREADS || '1', 10),
    time: parseInt(process.env.ARGON_TIME || '4', 10),
  },
};

export default hashingConfig;
