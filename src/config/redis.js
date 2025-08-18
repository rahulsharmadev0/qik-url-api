import { createClient } from 'redis';

class RedisService {
  static _instance = null;

  static async initialize() {
    if (!RedisService._instance) {
      RedisService._instance = new RedisService();
      await RedisService._instance.init();
    }
    return RedisService._instance;
  }

  static get client() { return RedisService._instance.client };

  #client;
  constructor() {
    this.#client = null;
  }
  get client() {
    if (!this.#client) throw new Error('Redis client not initialized.');
    return this.#client;
  }

  async init() {
    try {
      const config = {
        url: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
        socket: { reconnectDelay: 100, connectTimeout: 60000 }
      };

      this.#client = createClient(config)
        .on('error', err => console.error('❌ Redis Error:', err))
        .on('connect', () => console.log('✅ Redis connected'))
        .on('reconnecting', () => console.log('🔄 Redis reconnecting...'))
        .on('end', () => console.log('🔴 Redis disconnected'));

      await this.#client.connect();
      await this.#client.ping();
      console.log('🚀 Redis initialized');
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      throw error;
    }
  }
  async close() {
    if (this.#client?.isOpen) {
      try {
        await this.#client.quit();
        this._initialized = false;
        this.#client = null;
        console.log('🔴 Redis closed');
      } catch (error) {
        console.warn('Redis shutdown warning:', error.message);
      }
    }
  }
}


// Export the service instance and legacy functions for compatibility
export { RedisService };

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await RedisService._instance.close();
  process.exit(0);
});
