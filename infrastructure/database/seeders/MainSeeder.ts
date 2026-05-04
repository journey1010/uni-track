import { Seeder, runSeeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import RbacSeeder from './RbacSeeder';
import UserSeeder from './UserSeeder';

export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    await runSeeder(dataSource, RbacSeeder);
    await runSeeder(dataSource, UserSeeder);
  }
}