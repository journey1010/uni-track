import { Seeder } from 'typeorm-extension';
import { DataSource, Repository } from 'typeorm';
import RbacSeeder from './RbacSeeder';
import UserSeeder from './UserSeeder';
import { Migration } from '../../../src/modules/MigrationSeeders/domain/Entities/migration.entity';
import { DateTime } from '../../config/timezone.config';

export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    await dataSource.transaction(async (manager) => {
      const migrationRepository = manager.getRepository(Migration);

      const seeders = [
        { name: 'RbacSeeder', instance: new RbacSeeder() },
        { name: 'UserSeeder', instance: new UserSeeder() },
      ];

      for (const seeder of seeders) {
        const alreadyExecuted = await this.exists(seeder.name, migrationRepository);

        if (!alreadyExecuted) {
          console.log(`Running seeder: ${seeder.name}`);

          await seeder.instance.run(manager);

          await migrationRepository.save({
            name: seeder.name,
            created_at: DateTime.now().toJSDate(),
          });

          console.log(`${seeder.name} completed and registered.`);
        } else {
          console.log(` Skipping ${seeder.name}: already in database.`);
        }
      }
    });
  }

  private async exists(name: string, repository: Repository<Migration>): Promise<boolean> {
    return await repository.existsBy({ name: name });
  }
}