import { sequelize } from './sequelize';

export async function ensurePostgresEnums(): Promise<void> {
  if (sequelize.getDialect() !== 'postgres') {
    return;
  }

  const addEnumValue = async (enumName: string, value: string) => {
    try {
      const escapedValue = sequelize.escape(value);
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum
            WHERE enumlabel = ${escapedValue}
              AND enumtypid = '${enumName}'::regtype
          ) THEN
            ALTER TYPE "${enumName}" ADD VALUE ${escapedValue};
          END IF;
        END $$;
      `);
    } catch (error) {
      console.warn(`Failed to add enum value ${value} to ${enumName}:`, error);
    }
  };

  try {
    await Promise.all([
      addEnumValue('enum_tasks_status', 'todo'),
      addEnumValue('enum_tasks_status', 'in_progress'),
      addEnumValue('enum_tasks_status', 'review'),
      addEnumValue('enum_tasks_status', 'done'),
      addEnumValue('enum_tasks_priority', 'urgent'),
    ]);
  } catch (error) {
    console.warn('PostgreSQL enum setup warning:', error);
  }
}
