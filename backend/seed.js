// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const { recalculateProjectStatus } = require('./utils/projectStatusHelper');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/issat_project_management';

async function seedDatabase() {
  try {
    console.log('🔄 Connexion à MongoDB pour le seed...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB.');

    // 1. Nettoyage des anciennes données
    console.log('🧹 Nettoyage des anciennes collections...');
    await Task.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});

    // 2. Création des utilisateurs avec rôles distincts
    console.log('👤 Création des utilisateurs...');
    const defaultPassword = await bcrypt.hash('Password123!', 10);

    const adminUser = await User.create({
      name: 'Directeur Admin',
      email: 'admin@issat.tn',
      password: defaultPassword,
      role: 'Administrateur'
    });

    const chefProjetUser = await User.create({
      name: 'Sami Khelifi (Chef)',
      email: 'chef@issat.tn',
      password: defaultPassword,
      role: 'Chef de projet'
    });

    const employe1 = await User.create({
      name: 'Amira Trabelsi (Dev)',
      email: 'amira@issat.tn',
      password: defaultPassword,
      role: 'Employé'
    });

    const employe2 = await User.create({
      name: 'Yassine Ayari (Design)',
      email: 'yassine@issat.tn',
      password: defaultPassword,
      role: 'Employé'
    });

    console.log(`✅ 4 Utilisateurs créés :
      - Admin: admin@issat.tn (Administrateur)
      - Chef de Projet: chef@issat.tn (Chef de projet)
      - Employé 1: amira@issat.tn (Employé)
      - Employé 2: yassine@issat.tn (Employé)
      [Mot de passe commun : Password123!]`);

    // 3. Création des Projets
    console.log('📁 Création des projets...');
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const inFortyFiveDays = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const project1 = await Project.create({
      name: 'Plateforme E-learning ISSAT',
      description: 'Conception et déploiement de la plateforme d’apprentissage interactif et gestion des cours.',
      startDate: tenDaysAgo,
      endDate: inThirtyDays,
      status: 'Non commencé',
      createdBy: chefProjetUser._id
    });

    const project2 = await Project.create({
      name: 'Application Mobile Étudiants',
      description: 'Développement d’une application mobile pour les emplois du temps, notes et annonces.',
      startDate: now,
      endDate: inFortyFiveDays,
      status: 'Non commencé',
      createdBy: adminUser._id
    });

    const project3 = await Project.create({
      name: 'Refonte Réseau & Infrastructure',
      description: 'Mise à niveau des équipements réseau, serveurs de virtualisation et sécurité du campus.',
      startDate: fortyDaysAgo,
      endDate: fiveDaysAgo,
      status: 'Non commencé',
      createdBy: chefProjetUser._id
    });

    console.log('✅ 3 Projets créés avec succès.');

    // 4. Création des Tâches associées aux projets et assignées aux employés
    console.log('📝 Création et affectation des tâches...');

    // Tâches Projet 1
    await Task.create({
      title: 'Conception de l’architecture backend et modèle Mongoose',
      description: 'Définir les schémas User, Project et Task et sécuriser les routes avec JWT.',
      status: 'Terminée',
      priority: 'Haute',
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      project: project1._id,
      assignedTo: employe1._id
    });

    await Task.create({
      title: 'Développement de l’interface utilisateur 3D Three.js',
      description: 'Intégration du composant Guardian 3D et des animations réactives au mot de passe.',
      status: 'En cours',
      priority: 'Haute',
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      project: project1._id,
      assignedTo: employe2._id
    });

    await Task.create({
      title: 'Tests de charge et validation des permissions rôles',
      description: 'Exécuter la suite de tests automatisés Jest et valider le filtrage par acteur.',
      status: 'Non commencée',
      priority: 'Moyenne',
      dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      project: project1._id,
      assignedTo: employe1._id
    });

    // Tâches Projet 2
    await Task.create({
      title: 'Spécification des endpoints API REST pour l’app mobile',
      description: 'Documenter et valider les formats JSON pour les plannings et notifications.',
      status: 'En cours',
      priority: 'Haute',
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      project: project2._id,
      assignedTo: employe1._id
    });

    await Task.create({
      title: 'Maquettage UX/UI mobile (Figma)',
      description: 'Création des écrans d’accueil, de login et de suivi des cours.',
      status: 'Non commencée',
      priority: 'Moyenne',
      dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      project: project2._id,
      assignedTo: employe2._id
    });

    // Tâches Projet 3 (Projet terminé avec toutes ses tâches terminées)
    await Task.create({
      title: 'Audit de sécurité des équipements réseau',
      description: 'Inspection des pare-feu et configurations VLANs de l’institut.',
      status: 'Terminée',
      priority: 'Haute',
      dueDate: new Date(fiveDaysAgo.getTime() - 2 * 24 * 60 * 60 * 1000),
      project: project3._id,
      assignedTo: employe1._id
    });

    await Task.create({
      title: 'Installation et configuration des nouveaux switchs Cisco',
      description: 'Remplacement des anciens switchs et test de bande passante.',
      status: 'Terminée',
      priority: 'Moyenne',
      dueDate: fiveDaysAgo,
      project: project3._id,
      assignedTo: employe2._id
    });

    // 5. Recalcul automatique des statuts des projets
    console.log('⚙️ Recalcul automatique des statuts des projets selon leurs tâches...');
    await recalculateProjectStatus(project1._id);
    await recalculateProjectStatus(project2._id);
    await recalculateProjectStatus(project3._id);

    const updatedP1 = await Project.findById(project1._id);
    const updatedP2 = await Project.findById(project2._id);
    const updatedP3 = await Project.findById(project3._id);

    console.log(`📊 Statuts finaux des projets :
      - "${updatedP1.name}": ${updatedP1.status} (Contient tâches terminées, en cours et non commencées)
      - "${updatedP2.name}": ${updatedP2.status} (Contient tâches en cours et non commencées)
      - "${updatedP3.name}": ${updatedP3.status} (Toutes tâches terminées -> statut automatique "Terminé")
    `);

    console.log('🎉 Seed de la base de données terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du seed :', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB.');
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
