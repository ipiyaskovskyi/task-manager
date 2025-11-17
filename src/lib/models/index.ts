import { sequelize } from '../db/sequelize';
import { User } from './User.model';
import { Task } from './Task.model';

Task.belongsTo(User, {
  foreignKey: 'assigneeId',
  as: 'assignee',
});

User.hasMany(Task, {
  foreignKey: 'assigneeId',
  as: 'tasks',
});

export { sequelize, User, Task };
