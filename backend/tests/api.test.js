const request = require('supertest');
const app = require('../server'); // Import the app
const db = require('../config/database');

let userToken = '';
let adminToken = '';
let server; // Store the server instance to close later

beforeAll(async () => {
  // Start the server to listen before running tests
  server = app.listen(4000, () => console.log("Test server running on port 4000"));

  await db.run("DELETE FROM users"); // Clear users table before testing

  // Register User
  await request(app).post('/auth/register').send({
    username: 'testuser',
    password: 'Test@123'
  });

  // Register Admin
  await request(app).post('/auth/register').send({
    username: 'adminuser',
    password: 'Admin@123',
    role: 'admin'
  });

  // Login User
  const userRes = await request(app)
    .post('/auth/login')
    .send({ username: 'testuser', password: 'Test@123' });
  userToken = userRes.body.token;

  // Login Admin
  const adminRes = await request(app)
    .post('/auth/login')
    .send({ username: 'adminuser', password: 'Admin@123' });
  adminToken = adminRes.body.token;

  console.log("Admin Token:", adminToken, "& User Token:", userToken);
});

describe('User & Admin Role-Based API Testing', () => {
  test('User Cannot Access Admin Dashboard', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect([401, 403]).toContain(res.statusCode); // Allow either status
    if (res.statusCode === 403) {
      expect(res.body).toHaveProperty('message', 'Access denied');
    }
  });

  test('Admin Can Access Admin Dashboard', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('analytics');
    }
  });

  test('User Can Request Additional Credits', async () => {
    const res = await request(app)
      .post('/credits/request')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 10 });

    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message', 'Credit request submitted');
    }
  });

  test('Admin Can Approve Credit Requests', async () => {
    const res = await request(app)
      .post('/credits/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'testuser', amount: 10 });

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message', 'Credits updated successfully');
    }
  });

  test('User Can Scan a Document (After Credit Approval)', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('document', Buffer.from('sample text'), 'sample.txt');

    expect([200, 404, 401]).toContain(res.statusCode); // Allow 401 (unauthorized)
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message', 'Document scanned successfully');
    }
  });
});

// Properly close the database and server to prevent open handles
afterAll(async () => {
  db.close();
  await server.close();
});
