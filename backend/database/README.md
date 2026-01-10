# Database

This directory is responsible for all database-related tasks, including managing the schema, running migrations, and seeding initial data.

## Structure

- **`migrations/`**: This subfolder holds all the database migration files. Migrations are used to manage incremental and reversible changes to the database schema. Each migration file is a script that details the changes to be applied or reversed.

- **`schema.prisma` (or similar ORM schema file)**: This file defines the complete database schema using the Prisma schema language (or another ORM's schema definition). It serves as the single source of truth for the database structure.

- **`seeds.ts` (or `seeds/`)**: This file or directory contains scripts for populating the database with initial or test data. This is crucial for setting up a development environment or for ensuring a baseline state for the application.

## Migrations

Migrations are managed using the chosen ORM's migration tool (e.g., `prisma migrate`).

- **To create a new migration**: `npx prisma migrate dev --name <migration_name>`
- **To apply migrations**: `npx prisma migrate deploy`
- **To revert a migration**: This is typically handled by creating a new migration that undoes the changes.

## Seeding

The database can be seeded with initial data by running the seed script: `npx prisma db seed`.

This setup ensures that the database schema is version-controlled, easily reproducible, and evolves in a structured manner alongside the application code.
