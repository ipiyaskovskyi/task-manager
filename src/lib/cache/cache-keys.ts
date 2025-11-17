export const CacheKeys = {
  task: (id: number) => `task:${id}`,
  tasks: (filters?: string) => `tasks:${filters || 'all'}`,
  tasksPage: (page: number, limit: number, filters?: string) =>
    `tasks:page:${page}:limit:${limit}:${filters || 'all'}`,
  user: (id: number) => `user:${id}`,
  tasksCount: (filters?: string) => `tasks:count:${filters || 'all'}`,
} as const;

export const CacheTTL = {
  task: 300,
  tasks: 60,
  tasksPage: 60,
  user: 600,
  tasksCount: 60,
} as const;
