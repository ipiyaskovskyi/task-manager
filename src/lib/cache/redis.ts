import Redis from 'ioredis';

let redisClient: Redis | null = null;

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const USE_REDIS = process.env.USE_REDIS === 'true';

export function getRedisClient(): Redis | null {
  if (!USE_REDIS) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      redisClient.on('error', (error) => {
        console.error('Redis connection error:', error);
        redisClient = null;
      });

      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      redisClient = null;
    }
  }

  return redisClient;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const value = await client.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

export async function deleteCachePattern(pattern: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Redis delete pattern error:', error);
    return false;
  }
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      await client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
