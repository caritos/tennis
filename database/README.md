# Database Directory

This directory contains all database-related files for the Play Serve tennis app, including Supabase migrations, SQL functions, and configuration.

## Structure

```
database/
├── migrations/           # Supabase auto-generated migrations (timestamped)
├── functions/           # PostgreSQL function definitions
├── manual/              # Manual SQL scripts for one-time fixes
├── config.toml          # Main Supabase configuration
├── config.development.toml  # Development environment config
├── config.production.toml   # Production environment config
└── setup.sql            # Initial database setup script
```

## Migration Management

### Create a new migration
```bash
npm run db:diff -- migration_name
```

### Apply migrations
```bash
# Development
npm run env:dev
npm run db:push

# Production
npm run env:prod
npm run db:push
```

### Manual migrations
For one-time fixes or emergency patches, place SQL files in the `manual/` directory and apply them via Supabase Dashboard SQL Editor.

## Important Files

- **setup.sql**: Complete database schema setup
- **simplified-schema.sql**: Simplified RLS policies and structure
- **manual_migration_foreign_keys.sql**: Foreign key constraints fix

## Notes

- The `supabase` symlink at project root points to this directory for CLI compatibility
- Migrations are automatically ordered by timestamp
- Always test migrations in development before applying to production