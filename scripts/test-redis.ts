import { getRedisConnection } from '../lib/redis.js';

async function testRedis() {
  try {
    const redis = getRedisConnection();
    await redis.ping();
    console.log('✅ Redis connection successful');
    
    // Test set/get
    await redis.set('test-key', 'test-value');
    const value = await redis.get('test-key');
    console.log('✅ Redis set/get test:', value === 'test-value' ? 'PASSED' : 'FAILED');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  }
}

testRedis();