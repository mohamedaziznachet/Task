// backend/tests/projects.test.js
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

describe('📁 Projects Routes (/api/projects)', () => {
  describe('POST /api/projects (Permissions et validation)', () => {
    it('devrait permettre à un Administrateur de créer un projet', async () => {
      const { token } = await createTestUser({
        name: 'Admin Project',
        email: 'admin.proj@issat.tn',
        role: 'Administrateur'
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Projet Digitalisation ISSAT',
          description: 'Système numérique complet',
          startDate: '2026-01-01',
          endDate: '2026-06-01'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Projet Digitalisation ISSAT');
      expect(res.body.status).toBe('Non commencé');
    });

    it('devrait permettre à un Chef de projet de créer un projet', async () => {
      const { token } = await createTestUser({
        name: 'Chef Sami',
        email: 'chef.sami@issat.tn',
        role: 'Chef de projet'
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Projet Cloud Computing',
          description: 'Migration infrastructure',
          startDate: '2026-02-01',
          endDate: '2026-08-01'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Projet Cloud Computing');
    });

    it('devrait INTERDIRE à un Employé de créer un projet (403)', async () => {
      const { token } = await createTestUser({
        name: 'Employé Simple',
        email: 'employe.proj@issat.tn',
        role: 'Employé'
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Projet Non Autorisé',
          startDate: '2026-01-01',
          endDate: '2026-05-01'
        });

      expect(res.statusCode).toBe(403);
    });

    it('devrait refuser un projet dont le nom existe déjà (400)', async () => {
      const { token, user } = await createTestUser({
        name: 'Admin',
        email: 'admin.dup@issat.tn',
        role: 'Administrateur'
      });

      await Project.create({
        name: 'Projet Unique',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-01'),
        createdBy: user._id
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Projet Unique',
          startDate: '2026-02-01',
          endDate: '2026-07-01'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/doit être unique/i);
    });

    it('devrait refuser si la date de fin est antérieure à la date de début (400)', async () => {
      const { token } = await createTestUser({
        name: 'Admin Dates',
        email: 'admin.dates@issat.tn',
        role: 'Administrateur'
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Projet Dates Invalides',
          startDate: '2026-06-01',
          endDate: '2026-01-01' // Date de fin avant début !
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/postérieure à la date de début/i);
    });
  });

  describe('GET /api/projects', () => {
    it('devrait retourner la liste de tous les projets pour un utilisateur authentifié', async () => {
      const { token, user } = await createTestUser({
        name: 'User Liste',
        email: 'user.list@issat.tn',
        role: 'Employé'
      });

      await Project.create({
        name: 'Projet A',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-05-01'),
        createdBy: user._id
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Projet A');
    });

    it('devrait refuser l’accès sans token JWT (401)', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/projects/:id (Intégrité référentielle)', () => {
    it('devrait refuser la suppression d’un projet qui possède encore des tâches (400)', async () => {
      const { token: adminToken, user: admin } = await createTestUser({
        name: 'Admin Proj Del',
        email: 'admin.delproj@issat.tn',
        role: 'Administrateur'
      });

      const project = await Project.create({
        name: 'Projet Avec Tâches',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-01'),
        createdBy: admin._id
      });

      await Task.create({
        title: 'Tâche du projet',
        dueDate: new Date('2026-03-01'),
        project: project._id
      });

      const res = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/possède encore des tâches associées/i);
    });

    it('devrait supprimer un projet sans tâche avec succès', async () => {
      const { token: adminToken, user: admin } = await createTestUser({
        name: 'Admin Ok Del',
        email: 'admin.okdel@issat.tn',
        role: 'Administrateur'
      });

      const project = await Project.create({
        name: 'Projet Vide Supprimable',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-01'),
        createdBy: admin._id
      });

      const res = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/supprimé avec succès/i);
    });
  });
});
