// Simple in-memory Redis client mock compatible with redis v5 functions used
class MockRedis {
  constructor() { this.data = new Map(); this.ttl = new Map(); }
  async connect() {}
  async ping() { return 'PONG'; }
  async get(key) { return this.data.get(key) ?? null; }
  async setEx(key, ttlSeconds, value) { this.data.set(key, value); this.ttl.set(key, Date.now() + ttlSeconds * 1000); }
  async set(key, value) { this.data.set(key, value); }
  async incr(key) { const v = (parseInt(this.data.get(key) || '0', 10) + 1); this.data.set(key, String(v)); return v; }
  async expire(key, ttlSeconds) { this.ttl.set(key, Date.now() + ttlSeconds * 1000); }
  async del(key) { this.data.delete(key); this.ttl.delete(key); }
  async quit() {}
}

export function createClient() { return new MockRedis(); }
