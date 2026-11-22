// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../server');
const { connectDB, clearDB, closeDB, createTestUser } = require('./setup');
const Task = require('../models/Task');
const Project = require('../models/Project');

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

describe('🔐 Auth & Role Management Routes (/api/auth)', () => {
  describe('POST /api/auth/register', () => {
    it('devrait enregistrer un nouvel utilisateur avec le rôle Employé par défaut', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Nouvel Employé',
          email: 'employe.test@issat.tn',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('Employé');
      expect(res.body.email).toBe('employe.test@issat.tn');
    });

    it('devrait FORCER le rôle Employé même si le client tente d’envoyer "Administrateur" (Sécurité)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Attempt',
          email: 'hacker@issat.tn',
          password: 'Password123!',
          role: 'Administrateur' // Faille tentée
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.role).toBe('Employé'); // Le rôle forcé doit être Employé
    });

    it('devrait refuser l’inscription si l’email existe déjà (400)', async () => {
      await createTestUser({
        name: 'Existant',
        email: 'duplicate@issat.tn'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Tentative Duplicate',
          email: 'duplicate@issat.tn',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/déjà utilisé/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait connecter un utilisateur avec les bons identifiants et renvoyer un token', async () => {
      await createTestUser({
        name: 'Utilisateur Valide',
        email: 'valid@issat.tn',
        password: 'Password123!',
        role: 'Employé'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@issat.tn',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('Employé');
      expect(res.body.name).toBe('Utilisateur Valide');
    });

    it('devrait refuser la connexion si le mot de passe est incorrect (401)', async () => {
      await createTestUser({
        name: 'Utilisateur',
        email: 'user@issat.tn',
        password: 'Password123!'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@issat.tn',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/incorrect/i);
    });

    it('devrait refuser la connexion si l’utilisateur n’existe pas (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inexistant@issat.tn',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/auth/users/:id (Gestion des Rôles)', () => {
    it('devrait permettre à un Administrateur de promouvoir un Employé en Chef de projet', async () => {
      const { token: adminToken } = await createTestUser({
        name: 'Admin Principal',
        email: 'admin.role@issat.tn',
        role: 'Administrateur'
      });

      const { user: employe } = await createTestUser({
        name: 'Simple Employe',
        email: 'simple@issat.tn',
        role: 'Employé'
      });

      const res = await request(app)
        .put(`/api/auth/users/${employe._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Simple Employe',
          email: 'simple@issat.tn',
          role: 'Chef de projet'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe('Chef de projet');
    });

    it('devrait REFUSER la modification de rôle si l’utilisateur n’est pas Administrateur (403)', async () => {
      const { token: employeToken, user: employe } = await createTestUser({
        name: 'Employé Voulant Promotion',
        email: 'self.promote@issat.tn',
        role: 'Employé'
      });

      const res = await request(app)
        .put(`/api/auth/users/${employe._id}`)
        .set('Authorization', `Bearer ${employeToken}`)
        .send({
          role: 'Administrateur'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Seul un Administrateur/i);
    });

    it('devrait interdire à un employé de modifier le compte d’un autre utilisateur (403)', async () => {
      const { token: employe1Token } = await createTestUser({
        name: 'Employé 1',
        email: 'emp1@issat.tn',
        role: 'Employé'
      });

      const { user: employe2 } = await createTestUser({
        name: 'Employé 2',
        email: 'emp2@issat.tn',
        role: 'Employé'
      });

      const res = await request(app)
        .put(`/api/auth/users/${employe2._id}`)
        .set('Authorization', `Bearer ${employe1Token}`)
        .send({
          name: 'Hacked Name'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/auth/users/:id (Règle de gestion des suppressions)', () => {
    it('devrait bloquer la suppression d’un employé ayant des tâches "En cours" (400)', async () => {
      const { token: adminToken, user: admin } = await createTestUser({
        name: 'Admin',
        email: 'admin.del@issat.tn',
        role: 'Administrateur'
      });

      const { user: employe } = await createTestUser({
        name: 'Employé Actif',
        email: 'actif@issat.tn',
        role: 'Employé'
      });

      const project = await Project.create({
        name: 'Projet Test Suppression',
        startDate: new Date(),
        endDate: new Date(Date.now() + 864000000),
        createdBy: admin._id
      });

      await Task.create({
        title: 'Tâche active',
        status: 'En cours',
        dueDate: new Date(Date.now() + 432000000),
        project: project._id,
        assignedTo: employe._id
      });

      const res = await request(app)
        .delete(`/api/auth/users/${employe._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Impossible de supprimer cet employé/i);
    });

    it('devrait supprimer un utilisateur sans tâche en cours avec succès (200)', async () => {
      const { token: adminToken } = await createTestUser({
        name: 'Admin',
        email: 'admin.ok@issat.tn',
        role: 'Administrateur'
      });

      const { user: employeLibre } = await createTestUser({
        name: 'Employé Libre',
        email: 'libre@issat.tn',
        role: 'Employé'
      });

      const res = await request(app)
        .delete(`/api/auth/users/${employeLibre._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/supprimé avec succès/i);
    });
  });
});
