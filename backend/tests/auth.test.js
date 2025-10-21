const request = require('supertest');
const { app, db } = require('../server');

// Close DB after tests
afterAll((done) => {
  db.close(done);
});

describe('POST /api/auth/login', () => {
  test('returns 200 and token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('username', 'admin');
  });

  test('returns 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
