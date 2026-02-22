import request from 'supertest';
import { createApp } from './app';
import { ensureSchema, pool } from './db';

const app = createApp(pool);

describe('Tasks API', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM tasks');
  });

  it('GET /health returns ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('POST /tasks creates a task', async () => {
    const response = await request(app).post('/tasks').send({
      title: 'Task test',
      description: 'Description test'
    });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Task test');
    expect(response.body.description).toBe('Description test');
    expect(response.body.done).toBe(false);
  });

  it('POST /tasks without title returns 400', async () => {
    const response = await request(app).post('/tasks').send({ title: '' });
    expect(response.status).toBe(400);
  });

  it('POST /tasks without description returns 400', async () => {
    const response = await request(app).post('/tasks').send({
      title: 'Task test',
      description: ''
    });
    expect(response.status).toBe(400);
  });

  it('PATCH /tasks/:id updates title and description', async () => {
    const created = await request(app).post('/tasks').send({
      title: 'Initial',
      description: 'Old description'
    });

    const response = await request(app).patch(`/tasks/${created.body.id}`).send({
      title: 'Updated title',
      description: 'Updated description'
    });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated title');
    expect(response.body.description).toBe('Updated description');
  });

  it('PATCH /tasks/:id not found returns 404', async () => {
    const response = await request(app).patch('/tasks/99999').send({ title: 'x' });
    expect(response.status).toBe(404);
  });
});
