# ⚡ TaskFlow — Enterprise Project & Task Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.19.2-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-4.8.4-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.19-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Tests-30%2F30%20Passed-brightgreen?style=for-the-badge&logo=jest&logoColor=white" alt="Jest Tests" />
</p>

---

## 📌 Présentation du Projet

**TaskFlow** est une plateforme SaaS complète de gestion de projets et d'orchestration de tâches d'entreprise conçue selon l'architecture **MERN 3-Tiers** (MongoDB, Express, React 19, Node.js).

Elle allie une expérience utilisateur ultra-réactive (Tableau Kanban glisser-déposer, chronogramme Gantt, calendrier interactif, moteur 3D Three.js) à un backend robuste et temps réel propulsé par **Socket.io**, garantissant une synchronisation instantanée multi-utilisateurs et une traçabilité intégrale via un journal d'audit.

---

## ✨ Fonctionnalités Majeures

### 1. 📊 4 Vues Synchronisées de Pilotage
- **Tableau Kanban Drag & Drop :** Organisation fluide des flux de travail par glisser-déposer entre les colonnes (*À faire*, *En cours*, *Terminé*) avec persistance immédiate en base de données.
- **Chronogramme Gantt (Timeline) :** Planification temporelle interactive, détection des chevauchements de dates et suivi des jalons de projet.
- **Calendrier Mensuel Interactif :** Visualisation matricielle des échéances avec modale d'édition rapide et alertes visuelles de retards.
- **Vue Liste Tabulaire :** Tableau de données complet avec recherche plein texte et filtrage multicritères (statut, priorité, projet, assignation, dates).

### 2. ⚡ Moteur Temps Réel (WebSockets / Socket.io)
- **Synchronisation d'état multi-clients :** Mise à jour instantanée des tâches et projets sans rechargement de page (`task:created`, `task:updated`, `task:status_changed`, `task:deleted`).
- **Notifications Push Ciblées :** Alertes directes aux membres assignés avec badge dynamique interactif dans l'en-tête.
- **Journal d'Audit en Direct :** Traçabilité horodatée de toutes les opérations métier avec affichage temps réel (`activity:new`).

### 3. 🛡️ Sécurité & Contrôle d'Accès Basé sur les Rôles (RBAC)
- **3 Rôles Métier Granulaires :**
  - **Administrateur :** Gouvernance globale, gestion des comptes utilisateurs, supervision de tous les projets et accès au journal d'audit complet.
  - **Chef de Projet :** Création et pilotage des projets, délégation des tâches, suivi de l'avancement global et gestion d'équipe.
  - **Employé :** Consultation de ses tâches assignées, mise à jour des statuts, gestion des listes de contrôle et participation aux discussions.
- **Sécurisation OWASP :** Hachage des mots de passe par **Bcrypt.js** (10 tours de salage), jetons d'authentification **JWT** stateless avec intercepteur Axios automatique et protection des routes par middleware.

### 4. 📁 Collaboration & Gestion Documentaire
- **Checklists de Sous-Tâches :** Découpage granulaire des livrables avec recalcul dynamique du taux de progression de la tâche.
- **Pièces Jointes & Fichiers (Multer) :** Téléversement sécurisé de documents, cahiers des charges et livrables (jusqu'à 10 Mo) avec téléchargement et suppression contrôlée.
- **Fils de Discussion :** Espace de commentaires horodatés par tâche pour faciliter la communication interne de l'équipe.

### 5. 📈 Dashboard Analytique & Export de Rapports
- Calcul en temps réel de 7 métriques de performance (projets totaux, taux d'achèvement, tâches en cours, alertes de dépassement d'échéance).
- **Export CSV automatisé :** Génération en 1 clic d'un rapport de performance consolidé pour les revues de direction.

### 6. 🌐 Expérience 3D Interactive (Three.js WebGL)
- Intégration d'un noyau 3D interactif (*Guardian 3D*) développé sous **Three.js** réagissant à 60 FPS aux actions de l'utilisateur sur la page d'authentification (focalisation, saisie sécurisée du mot de passe, succès ou erreur).

---

## 👥 Matrice des Rôles et Permissions (RBAC)

| Fonctionnalité | Employé | Chef de projet | Administrateur |
| :--- | :---: | :---: | :---: |
| Connexion & Expérience 3D WebGL | ✅ | ✅ | ✅ |
| Modification du profil & mot de passe personnel | ✅ | ✅ | ✅ |
| Tableau de bord analytique (KPIs) & Export CSV | ✅ | ✅ | ✅ |
| Vues Kanban, Gantt, Calendrier et Liste | ✅ | ✅ | ✅ |
| Mise à jour du statut des tâches assignées | ✅ | ✅ | ✅ |
| Gestion des sous-tâches, pièces jointes & commentaires | ✅ | ✅ | ✅ |
| Création, modification et clôture des projets | ❌ | ✅ | ✅ |
| Création, assignation et suppression de tâches | ❌ | ✅ | ✅ |
| Gestion des utilisateurs (Création, Rôles, Suppression) | ❌ | ❌ | ✅ |
| Consultation du Journal d'Audit Système | ❌ | ❌ | ✅ |

---

## 🏗️ Architecture Technique

```
Task/
├── backend/                  # API REST & Serveur WebSocket (Node.js / Express)
│   ├── middleware/           # Middleware d'authentification JWT & RBAC
│   ├── models/               # Modèles de données Mongoose (User, Project, Task, Activity)
│   ├── routes/               # Contrôleurs & Routes REST (Auth, Projects, Tasks, Dashboard, Activity)
│   ├── tests/                # Suite de 30 tests automatisés d'intégration (Jest & Supertest)
│   ├── utils/                # Logique métier (calcul de progression, helpers d'audit)
│   ├── socket.js             # Gestionnaire d'événements Socket.io en temps réel
│   └── server.js             # Point d'entrée de l'API et connexion MongoDB
│
├── frontend/                 # Client SPA Moderne (React 19, Vite, Tailwind CSS)
│   ├── public/               # Favicon & assets statiques
│   └── src/
│       ├── components/       # Composants réutilisables (Kanban, Gantt, Calendrier, Guardian 3D, Modales)
│       ├── context/          # Contextes React (AuthContext, SocketContext, ToastContext)
│       ├── pages/            # Vues applicatives (Dashboard, Projects, Tasks, Activity, Users, Login)
│       └── services/         # Client HTTP Axios avec intercepteurs automatiques
│
├── dev.js                    # Script d'orchestration pour lancer Frontend & Backend en une commande
└── package.json              # Scripts racine du projet
```

---

## 🚀 Installation & Démarrage Rapide

### Prérequis
- **Node.js** >= 18.x
- **MongoDB** local ou cluster **MongoDB Atlas**
- **Git**

### 1. Cloner le dépôt
```bash
git clone https://github.com/mohamedaziznachet/Task.git
cd Task
```

### 2. Installer toutes les dépendances
```bash
# Installation des dépendances racine, backend et frontend
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configuration des variables d'environnement
Créez un fichier `.env` dans le dossier `backend/` (ou copiez `backend/.env.example`) :
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow_management
JWT_SECRET=super_secret_jwt_key_taskflow_2026
```

### 4. Peupler la base de données (Jeu de données de démo)
```bash
npm run seed --prefix backend
```

> **Comptes de test préconfigurés (Mot de passe commun : `Password123!`) :**
> - 🛡️ **Administrateur :** `admin@taskflow.dev`
> - 👔 **Chef de projet :** `chef@taskflow.dev`
> - 💼 **Employé 1 :** `amira@taskflow.dev`
> - 💼 **Employé 2 :** `yassine@taskflow.dev`

### 5. Lancer l'application
Depuis la racine du projet, lancez simultanément le frontend et le backend :
```bash
npm run dev
```

- 🌐 **Interface Web (Frontend) :** [http://localhost:5173](http://localhost:5173)
- 🔌 **API REST & WebSockets (Backend) :** [http://localhost:5000](http://localhost:5000)

---

## 🧪 Tests Automatisés

Le backend est sécurisé par une suite complète de **30 tests d'intégration** exécutés avec **Jest** et **Supertest** sur une base de données en mémoire (**MongoDB Memory Server**) :

```bash
npm test --prefix backend
```

```text
PASS tests/tasks.test.js
PASS tests/auth.test.js
PASS tests/projects.test.js
PASS tests/dashboard.test.js

Test Suites: 4 passed, 4 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        4.82 s
```

---

## 💼 Descriptions pour CV & Profil Professionnel

### Format avec Puces (Recommandé pour CV & filtres ATS) :
> **Développeur Full-Stack (Projet Personnel) – TaskFlow**  
> *Plateforme Web Collaborative de Gestion de Projets & Tâches (React 19, Node.js, Express, MongoDB, Socket.io, Three.js, Tailwind CSS, Jest)*  
> - **Architecture Full-Stack & Planification Avancée :** Développement d'une SPA réactive sous React 19 et Node.js/Express intégrant 4 vues synchronisées (Kanban Drag & Drop, Chronogramme Gantt, Calendrier et Liste filtrable) avec moteur de recalcul automatique de l'avancement des projets.  
> - **Temps Réel & Collaboration (Socket.io) :** Implémentation d'une synchronisation bidirectionnelle instantanée pour les déplacements de tâches, système de notifications push en direct et journal d'audit des activités d'équipe.  
> - **Sécurité RBAC, Gestion Documentaire & 3D :** Contrôle d'accès granulaire sur 3 rôles (Admin, Chef de projet, Employé) via JWT et Bcrypt, gestion de pièces jointes jusqu'à 10 Mo (Multer), animation 3D interactive sous Three.js WebGL et validation par **30 tests d'intégration** (Jest/Supertest).

### Format Paragraphe Synthétique (LinkedIn / Bio) :
> Conception et développement de **TaskFlow**, une plateforme collaborative de gestion de projets d'entreprise sous architecture MERN (React 19, Node.js, Express, MongoDB). Mise en œuvre de 4 vues de planification synchronisées (Kanban interactif, Gantt, Calendrier, Liste), d'un moteur temps réel via WebSockets (Socket.io) pour les mises à jour instantanées et les notifications push, d'une gestion documentaire sécurisée (Multer), d'une authentification RBAC (JWT/Bcrypt) et d'une scène 3D interactive sous Three.js. Projet entièrement testé et validé par 30 tests automatisés Jest/Supertest.

---

## 👤 Auteur

**Mohamed Aziz Nachet**
- GitHub : [@mohamedaziznachet](https://github.com/mohamedaziznachet)
- Projet : [https://github.com/mohamedaziznachet/Task](https://github.com/mohamedaziznachet/Task)

---

## 📄 Licence
Ce projet est sous licence MIT — libre d'utilisation et d'adaptation.
