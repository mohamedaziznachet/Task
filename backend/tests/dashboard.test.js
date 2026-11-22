// backend/tests/dashboard.test.js
const request = require('supertest');
const app = require('../server');
const { connectDB, clearDB, closeDB, createTestUser } = require('./setup');
const Project = require('../models/Project');
const Task = require('../models/Task');

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

describe('📊 Dashboard Routes (/api/dashboard)', () => {
  it('devrait refuser l’accès aux statistiques sans authentification (401)', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.statusCode).toBe(401);
  });

  it('devrait calculer correctement les métriques et statistiques globales', async () => {
    const { token, user } = await createTestUser({
      name: 'Chef Dashboard',
      email: 'chef.dash@issat.tn',
      role: 'Chef de projet'
    });

    const now = new Date();
    const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const project1 = await Project.create({
      name: 'Projet En Cours',
      startDate: pastDate,
      endDate: futureDate,
      status: 'En cours',
      createdBy: user._id
    });

    const project2 = await Project.create({
      name: 'Projet Complété',
      startDate: pastDate,
      endDate: futureDate,
      status: 'Terminé',
      createdBy: user._id
    });

    // 1 Tâche terminée
    await Task.create({
      title: 'Tâche Terminée',
      status: 'Terminée',
      dueDate: pastDate,
      project: project2._id
    });

    // 1 Tâche en cours (en retard car dueDate < now)
    await Task.create({
      title: 'Tâche En Retard',
      status: 'En cours',
      dueDate: pastDate,
      project: project1._id
    });

    // 1 Tâche non commencée (future)
    await Task.create({
      title: 'Tâche Future',
      status: 'Non commencée',
      dueDate: futureDate,
      project: project1._id
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalProjects).toBe(2);
    expect(res.body.completedProjects).toBe(1);
    expect(res.body.totalTasks).toBe(3);
    expect(res.body.completedTasks).toBe(1);
    expect(res.body.inProgressTasks).toBe(1);
    expect(res.body.notStartedTasks).toBe(1);
    expect(res.body.overdueTasks).toBe(1);
  });
});
