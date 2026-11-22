// backend/tests/tasks.test.js
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

describe('📝 Tasks Routes (/api/tasks)', () => {
  let admin, adminToken, chef, chefToken, employe, employeToken, project;

  beforeEach(async () => {
    const adminData = await createTestUser({
      name: 'Admin Tasks',
      email: 'admin.tasks@issat.tn',
      role: 'Administrateur'
    });
    admin = adminData.user;
    adminToken = adminData.token;

    const chefData = await createTestUser({
      name: 'Chef Tasks',
      email: 'chef.tasks@issat.tn',
      role: 'Chef de projet'
    });
    chef = chefData.user;
    chefToken = chefData.token;

    const empData = await createTestUser({
      name: 'Amira Dev',
      email: 'amira.dev@issat.tn',
      role: 'Employé'
    });
    employe = empData.user;
    employeToken = empData.token;

    project = await Project.create({
      name: 'Projet Système Tâches',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-06-01'),
      createdBy: chef._id
    });
  });

  describe('POST /api/tasks (Création & Validation)', () => {
    it('devrait permettre à un Chef de projet de créer une tâche valide', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${chefToken}`)
        .send({
          title: 'Création base de données',
          description: 'Mettre en place MongoDB',
          status: 'Non commencée',
          priority: 'Haute',
          dueDate: '2026-04-15',
          project: project._id,
          assignedTo: employe._id
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Création base de données');
      expect(res.body.assignedTo._id.toString()).toBe(employe._id.toString());
    });

    it('devrait INTERDIRE à un Employé de créer une tâche (403)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${employeToken}`)
        .send({
          title: 'Tâche Non Autorisée',
          dueDate: '2026-04-15',
          project: project._id
        });

      expect(res.statusCode).toBe(403);
    });

    it('devrait refuser une tâche dont la date limite dépasse les limites du projet (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tâche Date Hors Projet',
          dueDate: '2026-08-01', // Projet se termine en juin 2026 !
          project: project._id
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/comprise entre le début/i);
    });

    it('devrait refuser d’affecter une tâche à un utilisateur inexistant (400)', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tâche Affectée Fake',
          dueDate: '2026-04-01',
          project: project._id,
          assignedTo: fakeId
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/employé inexistant/i);
    });
  });

  describe('PUT /api/tasks/:id (Mise à jour et recalcul automatique du statut projet)', () => {
    it('devrait permettre à un employé de mettre à jour le statut d’une tâche vers "En cours"', async () => {
      const task = await Task.create({
        title: 'Tâche à démarrer',
        status: 'Non commencée',
        dueDate: new Date('2026-04-10'),
        project: project._id,
        assignedTo: employe._id
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${employeToken}`)
        .send({ status: 'En cours' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('En cours');

      // Vérifier le recalcul automatique du statut du projet parent
      const updatedProject = await Project.findById(project._id);
      expect(updatedProject.status).toBe('En cours');
    });

    it('devrait passer le statut du projet à "Terminé" quand toutes ses tâches sont "Terminée"', async () => {
      const task1 = await Task.create({
        title: 'Tâche 1',
        status: 'Terminée',
        dueDate: new Date('2026-04-10'),
        project: project._id
      });

      const task2 = await Task.create({
        title: 'Tâche 2',
        status: 'En cours',
        dueDate: new Date('2026-04-20'),
        project: project._id
      });

      // L'employé termine la 2ème tâche
      await request(app)
        .put(`/api/tasks/${task2._id}`)
        .set('Authorization', `Bearer ${employeToken}`)
        .send({ status: 'Terminée' });

      const updatedProject = await Project.findById(project._id);
      expect(updatedProject.status).toBe('Terminé');
    });
  });

  describe('GET /api/tasks (Recherche et filtrage)', () => {
    beforeEach(async () => {
      await Task.create([
        {
          title: 'Audit Sécurité Web',
          status: 'En cours',
          priority: 'Haute',
          dueDate: new Date('2026-04-01'),
          project: project._id,
          assignedTo: employe._id
        },
        {
          title: 'Documentation API',
          status: 'Non commencée',
          priority: 'Faible',
          dueDate: new Date('2026-05-01'),
          project: project._id,
          assignedTo: null
        }
      ]);
    });

    it('devrait filtrer les tâches par mot-clé de recherche', async () => {
      const res = await request(app)
        .get('/api/tasks?search=S%C3%A9curit%C3%A9')
        .set('Authorization', `Bearer ${employeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Audit Sécurité Web');
    });

    it('devrait filtrer les tâches par statut', async () => {
      const res = await request(app)
        .get('/api/tasks?status=Non%20commenc%C3%A9e')
        .set('Authorization', `Bearer ${employeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Documentation API');
    });
  });
});
