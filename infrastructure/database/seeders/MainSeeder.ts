import { Seeder, runSeeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import RbacSeeder from './RbacSeeder';
import UserSeeder from './UserSeeder';

export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    await runSeeder(dataSource, RbacSeeder);
    await runSeeder(dataSource, UserSeeder);
  }
}