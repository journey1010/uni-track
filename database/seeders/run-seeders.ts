import { Logger } from '@nestjs/common';
import { runSeeders } from 'typeorm-extension';
import { AppDataSource } from '../../infrastructure/database/data-source';
import RbacSeeder from './RbacSeeder';
import UserSeeder from './UserSeeder';

const logger = new Logger('SeederBootstrap');

async function run() {
  try {
    logger.log('Initializing database connection...');
    await AppDataSource.initialize();
    logger.log('Database connection initialized.');

    logger.log('Running seeders...');
    await runSeeders(AppDataSource, {
      seeds: [RbacSeeder, UserSeeder],
    });

    logger.log('All seeders executed successfully.');
  } catch (error) {
    logger.error('Error during seeding process:');
    logger.error(error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.log('Database connection closed.');
    }
  }
}

run();
