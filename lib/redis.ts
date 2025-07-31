import  Redis  from 'ioredis';
import { ENV } from './env';

let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    const REDIS_URL = ENV.REDIS_URL;
    if (!REDIS_URL) throw new Error("REDIS_URL is not defined");
    
    // Use a factory function to create the instance
    connection = createRedisInstance(REDIS_URL);
  }
  return connection;
}

function createRedisInstance(url: string): Redis {
  const redis = new Redis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    tls: url.startsWith('rediss://') ? { 
      rejectUnauthorized: false 
    } : undefined,
  });
  
  redis.on('connect', () => console.log('🔌 Connected to Redis'));
  redis.on('error', (err) => console.error('Redis error:', err));
  
  return redis;
}