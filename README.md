Migrations
- Create: yarn typeorm migration:generate -- infrastructure/database/migrations/NombreMigracion -d infrastructure/database/data-source.ts
- Run: yarn typeorm migration:run -d infrastructure/database/data-source.ts
- Revert: yarn typeorm migration:revert -d infrastructure/database/data-source.ts