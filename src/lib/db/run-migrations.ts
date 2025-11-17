import { sequelize } from './sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';

export async function runMigrations(): Promise<void> {
  const migrationsPath = path.join(
    process.cwd(),
    'src',
    'lib',
    'db',
    'migrations'
  );

  const umzug = new Umzug({
    migrations: {
      glob: path.join(migrationsPath, '*.js'),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  try {
    const pending = await umzug.pending();
    if (pending.length > 0) {
      console.log(`Running ${pending.length} pending migration(s)...`);
      await umzug.up();
      console.log('Migrations completed successfully.');
    } else {
      console.log('No pending migrations.');
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}
