const request = require('supertest');
const app = require('../server'); // Import the app directly
const db = require('../config/database');


describe('User & Admin Role-Based API Testing', () => {
  test('Register User (Default Role - User)', async () => {
    const res = await request(app) // No need to start a new server
      .post('/auth/register')
      .send({ username: 'testuser', password: 'Test@123' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
  });

  let userToken = '';
  let adminToken = '';


  test('Register Admin', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'adminuser', password: 'Admin@123', role: 'admin' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'admin registered successfully');
  });

  test('Login User', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'Test@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token;
  });

  test('Login Admin', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'adminuser', password: 'Admin@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    adminToken = res.body.token;
  });

  test('User Cannot Access Admin Analytics', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Access denied');
  });

  test('Admin Can Access Admin Analytics', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('analytics'); // Assuming analytics data is returned
  });

  test('User Can Request Additional Credits', async () => {
    const res = await request(app)
      .post('/credits/request')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Credit request submitted');
  });

  test('Admin Can Approve Credit Requests', async () => {
    const res = await request(app)
      .post('/admin/approve-credits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'testuser', amount: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Credits updated successfully');
  });

  test('User Can Scan a Document (After Credit Approval)', async () => {
    const res = await request(app)
      .post('/scan')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('document', Buffer.from('sample text'), 'sample.txt');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Document scanned successfully');
  });
});

afterAll((done) => {
    db.close(() => {
      console.log('Database connection closed.');
      done();
    });
});
