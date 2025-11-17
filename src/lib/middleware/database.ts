import { getSequelize } from '../db/connection';

export async function withDatabase<T>(
  handler: (sequelize: ReturnType<typeof getSequelize>) => Promise<T>
): Promise<T> {
  const sequelize = getSequelize();
  await sequelize.authenticate();
  return handler(sequelize);
}
