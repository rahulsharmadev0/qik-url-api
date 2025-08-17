import { createClient } from 'redis';

let _redisClient;

export async function initRedis() {
    try {
        // Create Redis client
        _redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            password: process.env.REDIS_PASSWORD || '1234', // From docker-compose.yml
            socket: {
                reconnectDelay: 100,
                connectTimeout: 60000,
            },
        }).on('error', (err) => {
            console.error('❌ Redis Client Error:', err);
        }).on('connect', () => {
            console.log('✅ Redis connected');
        }).on('end', () => {
            console.log('🔴 Redis disconnected');
        });

        // Connect to Redis
        await _redisClient.connect();

        // Test the connection
        await _redisClient.ping();
        console.log('🚀 Redis initialized successfully');

    } catch (error) {
        console.error('❌ Failed to initialize Redis:', error);
        throw error;
    }
}

export const redis = () => {
    if (!_redisClient) throw new Error('Redis client not initialized. Call initRedis() first.');

    return _redisClient;
}

export async function closeRedis() {
    if (_redisClient && _redisClient.isOpen) {
        try {
            await _redisClient.quit();
            console.log('🔴 Redis connection closed');
        } catch (error) {
            console.log('Redis already closed or error during shutdown:', error.message);
        }
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await closeRedis();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await closeRedis();
    process.exit(0);
});
