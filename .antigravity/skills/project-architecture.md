# Skill: Project Architecture

## Overview
This project follows a **Hexagonal and Modular Architecture** with a pragmatic approach. It prioritizes development speed and scalability while maintaining a clear separation of concerns.

## Directory Structure

### Global Infrastructure (`src/infrastructure/`)
Transversal code that is used across multiple modules:
- **`config/`**: Configuration files mimicking Laravel's structure (e.g., `app.config.ts`, `database.config.ts`).
- **`database/`**: TypeORM connection setup and DataSource definitions.
- **Exception Handling**: Global filters and exception managers.
- **Middleware/Interceptors**: Other transversal logic.

### Modules (`src/modules/{module_name}/`)
Each module must follow this internal structure:

- **`application/`**: Use cases, DTOs, and application logic.
- **`domain/`**: The core of the module.
    - **`entities/`**: TypeORM entities or plain domain models.
    - **`repositories/`**: Repository interfaces (ports).
    - **`services/`**: Domain services.
    - **`rules/`**: Business rules/logic.
    - **`events/`**: Domain events.
- **`infrastructure/`**: Implementation details (adapters).
    - **`controllers/`**: Web controllers (e.g., NestJS controllers).
    - **`validation/`**: Schemas or classes for request validation.
    - **`persistence/`**: Concrete repository implementations (if separated from domain).

## Pragmatic Principles
1. **Speed over Purism**: While the structure is defined, don't be strictly purist if it hinders development speed for simple features.
2. **Modular Independence**: Try to keep modules decoupled, communicating through services or events when possible.
3. **Environment Management**: Always use the `ConfigurationService` (NestJS `ConfigService`) and defined config files in `src/infrastructure/config/`.
4. **Database Access**: Use TypeORM entities and repositories. Standard many-to-many relationships are preferred over manual polymorphic implementations for simplicity.

## Coding Standards
- Use **Yarn** for package management.
- Ensure all new entities are added to the corresponding `domain/entities` directory.
- Maintain consistency with the Laravel-style configuration for environment variables.
