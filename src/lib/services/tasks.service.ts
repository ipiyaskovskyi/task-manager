import { Task, User } from '../models/index';
import type { Status, Priority } from '@/types';
import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
} from '../cache/redis';
import { CacheKeys, CacheTTL } from '../cache/cache-keys';

export interface CreateTaskData {
  title: string;
  description?: string | null;
  type?: string | null;
  status?: Status;
  priority?: Priority;
  deadline?: Date | null;
  assigneeId?: number | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  type?: string | null;
  status?: Status;
  priority?: Priority;
  deadline?: Date | null;
  assigneeId?: number | null;
}

export interface TaskFilters {
  status?: Status;
  priority?: Priority;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTasks {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class TasksService {
  private getFiltersKey(filters?: TaskFilters): string {
    if (!filters) return 'all';
    const parts: string[] = [];
    if (filters.status) parts.push(`status:${filters.status}`);
    if (filters.priority) parts.push(`priority:${filters.priority}`);
    if (filters.createdFrom) parts.push(`from:${filters.createdFrom}`);
    if (filters.createdTo) parts.push(`to:${filters.createdTo}`);
    return parts.length > 0 ? parts.join('|') : 'all';
  }

  async getAllTasks(filters?: TaskFilters): Promise<Task[] | PaginatedTasks> {
    const where: WhereOptions = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.createdFrom || filters?.createdTo) {
      const createdAtFilter: {
        [Op.gte]?: Date;
        [Op.lte]?: Date;
      } = {};
      if (filters.createdFrom) {
        const fromDate = new Date(filters.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = fromDate;
      }
      if (filters.createdTo) {
        const toDate = new Date(filters.createdTo);
        toDate.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = toDate;
      }
      if (Object.keys(createdAtFilter).length > 0) {
        where.createdAt = createdAtFilter;
      }
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const filtersKey = this.getFiltersKey(filters);
    const cacheKey = filters?.page
      ? CacheKeys.tasksPage(page, limit, filtersKey)
      : CacheKeys.tasks(filtersKey);

    const cached = await getCache<Task[] | PaginatedTasks>(cacheKey);
    if (cached) {
      return cached;
    }

    if (filters?.page) {
      const { count, rows } = await Task.findAndCountAll({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstname', 'lastname', 'email'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

      const totalPages = Math.ceil(count / limit);
      const result: PaginatedTasks = {
        tasks: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      await setCache(cacheKey, result, CacheTTL.tasksPage);
      return result;
    }

    const tasks = await Task.findAll({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstname', 'lastname', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    await setCache(cacheKey, tasks, CacheTTL.tasks);
    return tasks;
  }

  async getTaskById(id: number) {
    const cacheKey = CacheKeys.task(id);
    const cached = await getCache<Task>(cacheKey);
    if (cached) {
      return cached;
    }

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstname', 'lastname', 'email'],
          required: false,
        },
      ],
    });

    if (task) {
      await setCache(cacheKey, task, CacheTTL.task);
    }

    return task;
  }

  async createTask(data: CreateTaskData) {
    const task = await Task.create({
      title: data.title,
      description: data.description || null,
      type: data.type || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      deadline: data.deadline !== undefined ? data.deadline : null,
      assigneeId: data.assigneeId || null,
    });

    await deleteCachePattern('tasks:*');
    return await this.getTaskById(task.id);
  }

  async updateTask(id: number, data: UpdateTaskData) {
    const task = await Task.findByPk(id);
    if (!task) {
      return null;
    }

    if (data.title !== undefined) {
      task.title = data.title;
    }
    if (data.description !== undefined) {
      task.description = data.description;
    }
    if (data.type !== undefined) {
      task.type = data.type;
    }
    if (data.status !== undefined) {
      task.status = data.status;
    }
    if (data.priority !== undefined) {
      task.priority = data.priority;
    }
    if (data.deadline !== undefined) {
      task.deadline = data.deadline === null ? null : data.deadline;
    }
    if (data.assigneeId !== undefined) {
      task.assigneeId = data.assigneeId;
    }

    await task.save();
    await deleteCache(CacheKeys.task(id));
    await deleteCachePattern('tasks:*');
    return await this.getTaskById(task.id);
  }

  async deleteTask(id: number) {
    const task = await Task.findByPk(id);
    if (!task) {
      return false;
    }
    await task.destroy();
    await deleteCache(CacheKeys.task(id));
    await deleteCachePattern('tasks:*');
    return true;
  }
}
