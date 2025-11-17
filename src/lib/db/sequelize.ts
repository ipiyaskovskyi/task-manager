import { Sequelize } from 'sequelize';

const isTest = process.env.NODE_ENV === 'test';
const usePostgres =
  process.env.USE_POSTGRES === 'true' || process.env.POSTGRES_HOST;

let sequelizeInstance: Sequelize;

if (isTest) {
  sequelizeInstance = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else if (usePostgres) {
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = Number(process.env.POSTGRES_PORT ?? 5432);
  const username = process.env.POSTGRES_USER ?? 'ipiaskovskyi';
  const password = process.env.POSTGRES_PASSWORD ?? '';
  const database = process.env.POSTGRES_DB ?? 'db_development';

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

  console.log(
    `Connecting to PostgreSQL: ${username}@${host}:${port}/${database}`
  );
} else {
  sequelizeInstance = new Sequelize({
    dialect: 'sqlite',
    storage: './data/database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
  console.log('Using SQLite database: ./data/database.sqlite');
}

export const sequelize = sequelizeInstance;
