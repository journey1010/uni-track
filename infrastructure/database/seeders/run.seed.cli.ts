import { AppDataSource } from '../data-source';
import MainSeeder from './main.seed';

async function main() {
  await AppDataSource.initialize();
  const seeder = new MainSeeder();
  await seeder.run(AppDataSource);
  await AppDataSource.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});