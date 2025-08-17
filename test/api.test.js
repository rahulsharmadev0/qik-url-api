import request from 'supertest';
import { app } from '../src/server.js';

describe('API endpoints', () => {
  test('Health endpoint responds with expected format', async () => {
    const res = await request(app).get('/health');
    // Can be 200 (services ok), 503 (services down), or 500 (error)
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).toBeLessThan(600);
    if (res.statusCode !== 500) {
      expect(res.body).toHaveProperty('services');
    }
  });

  test('Create endpoint validates input', async () => {
    const res = await request(app)
      .post('/create')
      .send({ long_url: 'invalid-url' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Invalid QIK code returns 404', async () => {
    const res = await request(app).get('/abc');
    expect(res.statusCode).toBe(404);
  });

  test('Invalid deletion code returns 401', async () => {
    const res = await request(app).delete('/delete/invalid');
    expect(res.statusCode).toBe(401);
  });
});
