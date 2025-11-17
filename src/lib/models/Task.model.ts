import {
  Model,
  DataTypes,
  type Optional,
  type BelongsToGetAssociationMixin,
} from 'sequelize';
import { sequelize } from '../db/sequelize';
import type { User } from './User.model';
import type { Status, Priority } from '@/types';

const isPostgres = sequelize.getDialect() === 'postgres';

export interface TaskAttributes {
  id: number;
  title: string;
  description?: string | null;
  type?: string | null;
  status: Status;
  priority: Priority;
  deadline?: Date | null;
  assigneeId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface TaskCreationAttributes
  extends Optional<
    TaskAttributes,
    | 'id'
    | 'description'
    | 'type'
    | 'status'
    | 'priority'
    | 'deadline'
    | 'assigneeId'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Task
  extends Model<TaskAttributes, TaskCreationAttributes>
  implements TaskAttributes
{
  declare id: number;
  declare title: string;
  declare description?: string | null;
  declare type?: string | null;
  declare status: Status;
  declare priority: Priority;
  declare deadline?: Date | null;
  declare assigneeId?: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare getAssignee: BelongsToGetAssociationMixin<User>;
  declare assignee?: User;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: isPostgres
        ? DataTypes.ENUM('todo', 'in_progress', 'review', 'done')
        : DataTypes.STRING,
      allowNull: false,
      defaultValue: 'todo',
    },
    priority: {
      type: isPostgres
        ? DataTypes.ENUM('low', 'medium', 'high', 'urgent')
        : DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium',
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigneeId',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt',
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
  }
);
