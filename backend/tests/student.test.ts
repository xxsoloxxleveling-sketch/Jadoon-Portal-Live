import request from 'supertest';
import app from '../src/app';

describe('Student Endpoints', () => {
  it('should return 401 if unauthorized when accessing students', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });

  it('should return 401 if unauthorized when creating student', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({
        first_name: 'Test',
        last_name: 'User',
        admission_number: '1234',
        dob: '2010-01-01',
        gender: 'Male',
        guardian_name: 'Guardian',
        guardian_phone: '1234567890',
        address: '123 Main St'
      });
    expect(res.status).toBe(401);
  });
});
