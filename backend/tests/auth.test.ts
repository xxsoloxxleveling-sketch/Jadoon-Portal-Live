import request from 'supertest';
import app from '../src/app';

describe('Auth Endpoints', () => {
  it('should return 400 for invalid login payload', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('should return 400 for missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });
});
