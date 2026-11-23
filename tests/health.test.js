/**
 * Health endpoint tests.
 */

import request from 'supertest';
import app from '../src/app/app.js';

describe('GET /health', () => {
  it('should return a health check response', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data).toHaveProperty('timestamp');
  });

  it('should return environment in the response', async () => {
    const res = await request(app).get('/health');
    expect(res.body.data).toHaveProperty('environment');
  });
});

describe('404 handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('code', 'ROUTE_NOT_FOUND');
  });
});
