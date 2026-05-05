Migrations
- Create: yarn typeorm migration:generate -- infrastructure/database/migrations/NombreMigracion -d infrastructure/database/data-source.ts
- Run: yarn typeorm migration:run -d infrastructure/database/data-source.ts
- Revert: yarn typeorm migration:revert -d infrastructure/database/data-source.ts

Seeders
- Run: yarn typeorm seeder:run infrastructure/database/seeders/{NameSeeder.ts} -d infrastructure/database/data-source.ts
- Create: yarn typeorm seeder:generate infrastructure/database/seeders/{NameSeeder.ts} -d infrastructure/database/data-source.ts