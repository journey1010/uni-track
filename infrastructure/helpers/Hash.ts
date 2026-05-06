import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { hashingConfig } from '../config/hashing.config';

export class Hash {
  /**
   * Hash the given value.
   *
   * @param value
   * @returns
   */
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

  /**
   * Check the given plain value against a hash.
   *
   * @param value
   * @param hashedValue
   * @returns
   */
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
