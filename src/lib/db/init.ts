import { sequelize } from './sequelize';
import { ensurePostgresEnums } from './postgres-enums';
import { runMigrations } from './run-migrations';
import { connectRedis } from '../cache/redis';
import '@/lib/models';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');

      if (sequelize.getDialect() === 'postgres') {
        await ensurePostgresEnums();
      }

      await connectRedis();

      if (process.env.RUN_MIGRATIONS === 'true') {
        try {
          await runMigrations();
          console.log('Database migrations completed.');
        } catch (migrationError) {
          console.error('Migration error:', migrationError);
          throw migrationError;
        }
      } else {
        const shouldSync =
          process.env.NODE_ENV !== 'production' ||
          sequelize.getDialect() === 'sqlite';

        if (shouldSync) {
          try {
            await sequelize.sync({
              alter: sequelize.getDialect() === 'sqlite',
            });
            console.log('Database models synchronized.');
          } catch (syncError) {
            console.warn('Database sync warning:', syncError);
          }
        }
      }
      isInitialized = true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}
