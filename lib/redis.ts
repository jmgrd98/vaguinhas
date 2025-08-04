// lib/redis.ts
import Redis from 'ioredis';
import { ENV } from './env';

// Use a global variable to maintain the Redis connection across hot reloads
const globalWithRedis = global as typeof globalThis & {
  redisConnection?: Redis;
};

// Create Redis instance with proper typing
function createRedisInstance(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true, // Changed to true for serverless compatibility
    tls: url.startsWith('rediss://') ? { 
      rejectUnauthorized: false 
    } : undefined,
    reconnectOnError: (err) => {
      console.log('Reconnecting on error:', err.message);
      return true;
    },
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('Too many Redis connection attempts');
        return null;
      }
      return Math.min(times * 200, 1000);
    }
  });
}

export function getRedisConnection(): Redis {
  if (!ENV.REDIS_URL) {
    throw new Error("REDIS_URL is not defined in environment variables");
  }

  // Reuse connection if exists in global context
  if (globalWithRedis.redisConnection) {
    return globalWithRedis.redisConnection;
  }

  // Create new connection
  const redis = createRedisInstance(ENV.REDIS_URL);
  
  // Add event listeners
  redis.on('connect', () => console.log('🔌 Connected to Redis'));
  redis.on('ready', () => console.log('🚀 Redis ready for commands'));
  redis.on('error', (err) => console.error('Redis error:', err));
  redis.on('close', () => console.log('🔴 Redis connection closed'));
  redis.on('reconnecting', () => console.log('🔄 Reconnecting to Redis'));

  // Store in global context
  globalWithRedis.redisConnection = redis;
  
  return redis;
}

// Next.js App Router compatible queue setup
export async function getEmailQueue() {
  const { Queue } = await import('bullmq');
  return new Queue('emailQueue', {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });
}

// Serverless-friendly connection closer
export async function closeRedisConnection() {
  if (globalWithRedis.redisConnection) {
    await globalWithRedis.redisConnection.quit();
    globalWithRedis.redisConnection = undefined;
    console.log('🛑 Redis connection closed gracefully');
  }
}

// Close connection on exit signals
if (typeof window === 'undefined') {
  process.on('exit', closeRedisConnection);
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
}