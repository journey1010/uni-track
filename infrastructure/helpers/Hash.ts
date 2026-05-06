import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { hashingConfig } from '../config/hashing.config';

export class Hash {
  static async make(value: string): Promise<string> {
    const { driver, bcrypt: bcryptConfig, argon: argonConfig } = hashingConfig;

    if (driver === 'bcrypt') {
      return bcrypt.hash(value, bcryptConfig.rounds);
    }

    if (driver === 'argon2' || driver === 'argon') {
      return argon2.hash(value, {
        memoryCost: argonConfig.memory,
        parallelism: argonConfig.threads,
        timeCost: argonConfig.time,
      });
    }

    throw new Error(`Driver [${driver}] not supported.`);
  }

  static async check(value: string, hashedValue: string): Promise<boolean> {
    const { driver } = hashingConfig;

    if (driver === 'bcrypt') {
      return bcrypt.compare(value, hashedValue);
    }

    if (driver === 'argon2' || driver === 'argon') {
      return argon2.verify(hashedValue, value);
    }

    throw new Error(`Driver [${driver}] not supported.`);
  }
}