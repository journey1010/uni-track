import { Seeder, runSeeders } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import RbacSeeder from './RbacSeeder';
import UserSeeder from './UserSeeder';

export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    await runSeeders(dataSource, {
      seeds: [RbacSeeder, UserSeeder],
    });
  }
}