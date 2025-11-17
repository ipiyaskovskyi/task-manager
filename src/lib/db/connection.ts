import { Sequelize } from 'sequelize';

let sequelizeInstance: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (sequelizeInstance) {
    return sequelizeInstance;
  }

  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    sequelizeInstance = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });
  } else {
    const host = process.env.POSTGRES_HOST ?? 'localhost';
    const port = Number(process.env.POSTGRES_PORT ?? 5432);
    const username = process.env.POSTGRES_USER ?? 'postgres';
    const password = process.env.POSTGRES_PASSWORD ?? 'postgres';
    const database = process.env.POSTGRES_DB ?? 'tasktracker';

    sequelizeInstance = new Sequelize(database, username, password, {
      host,
      port,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  }

  return sequelizeInstance;
}

export async function connectDatabase(): Promise<void> {
  const sequelize = getSequelize();
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    sequelizeInstance = null;
  }
}
