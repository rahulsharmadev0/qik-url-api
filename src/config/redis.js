import { createClient } from 'redis';

class RedisService {
  constructor() {
    this._client = null;
    this._initialized = false;
  }

  async init() {
    try {
      const config = {
        url: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
        socket: { reconnectDelay: 100, connectTimeout: 60000 }
      };

      this._client = createClient(config)
        .on('error', err => console.error('❌ Redis Error:', err))
        .on('connect', () => console.log('✅ Redis connected'))
        .on('reconnecting', () => console.log('🔄 Redis reconnecting...'))
        .on('end', () => console.log('🔴 Redis disconnected'));

      await this._client.connect();
      await this._client.ping();
      this._initialized = true;
      console.log('🚀 Redis initialized');
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      throw error;
    }
  }

  get instance() {
    if (!this._initialized || !this._client) {
      throw new Error('Redis not initialized. Call RedisService.init() first.');
    }
    return this._client;
  }

  async close() {
    if (this._client?.isOpen) {
      try {
        await this._client.quit();
        this._initialized = false;
        this._client = null;
        console.log('🔴 Redis closed');
      } catch (error) {
        console.warn('Redis shutdown warning:', error.message);
      }
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

// Export the service instance and legacy functions for compatibility
export { redisService };

// Create a getter function that returns the instance
export function getRedisInstance() {
  return redisService.instance;
}

// For backward compatibility - this will work once redis is initialized
export const redis = new Proxy({}, {
  get(target, prop) {
    return redisService.instance[prop];
  }
});

export const initRedis = () => redisService.init();
export const closeRedis = () => redisService.close();

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await redisService.close();
  process.exit(0);
});
