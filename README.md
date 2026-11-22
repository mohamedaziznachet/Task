# 🚀 TaskFlow — Plateforme Collaborative de Gestion de Projets & Tâches
### ISSAT Kasserine • 3 GLSI • Génie Logiciel & Web Avancé

![React 19](https://img.shields.io/badge/React-19.3.1-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19.2-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8.4-010101?logo=socket.io&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.186.1-000000?logo=three.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4.19-06B6D4?logo=tailwindcss&logoColor=white)
![Jest Tests](https://img.shields.io/badge/Tests-30%2F30%20Passed-brightgreen?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/Academic-3_GLSI-blue)

---

## 📌 À propos du Projet

**TaskFlow** est une application web moderne et réactive conçue selon l'architecture **MERN 3-Tiers** (MongoDB, Express, React, Node.js). Elle centralise la planification agile, la délégation des activités, la collaboration en temps réel et le pilotage analytique des projets.

Elle intègre un **moteur 3D interactif Three.js** pour une expérience d'authentification immersive, un système de **synchronisation WebSocket bidirectionnelle avec Socket.io**, et un moteur de **recalcul automatique de l'avancement des projets (RG-08)**.

---

## 💼 Résumé pour CV / Portfolio (Descriptions prêtes à l'emploi)

### Format avec puces (Recommandé pour CV & filtres ATS) :
> **TaskFlow – Plateforme Web Collaborative de Gestion de Projets & Tâches** *(MERN Stack)*  
> **Technologies :** React 19, Node.js, Express.js, MongoDB, Socket.io, Three.js, Tailwind CSS, JWT, Bcrypt, Multer, Jest  
> * **Architecture Full-Stack & Planification Avancée :** Développement d'une SPA sous React 19 et Node.js/Express intégrant 4 vues de pilotage synchronisées (Tableau Kanban Drag & Drop, Chronogramme Gantt, Calendrier et Liste filtrable) avec moteur de recalcul automatique du pourcentage d'avancement des projets.  
> * **Temps Réel & Collaboration (Socket.io) :** Mise en place d'une synchronisation bidirectionnelle instantanée pour les déplacements de tâches, système de notifications push en direct et journal d'audit de traçabilité des activités.  
> * **Sécurité RBAC, Gestion Documentaire & 3D :** Authentification sécurisée par JWT et Bcrypt avec gestion granulaire de 3 rôles (Admin, Chef de projet, Employé), téléversement de pièces jointes (Multer), animation 3D interactive sous Three.js et couverture de **30 tests d'intégration** (Jest/Supertest).

### Format Paragraphe Court (Idéal pour LinkedIn ou CV 1 page) :
> Conception et réalisation d'une application web collaborative centralisant la gestion de projets et l'affectation de tâches. Implémentation d'un tableau Kanban interactif (Drag & Drop), d'un planning Gantt et d'un calendrier avec synchronisation en temps réel via Socket.io et calcul automatique de l'avancement. Sécurisation des accès selon 3 rôles (RBAC) par JWT/Bcrypt, gestion des pièces jointes (Multer), animation 3D avec Three.js et validation par 30 tests automatisés Jest/Supertest.

---

## ✨ Fonctionnalités Clés

### 1. 📊 4 Vues Multidimensionnelles de Planification
- **Tableau Kanban Interactif :** Déplacement fluide des tâches par glisser-déposer (*Drag & Drop*) entre les colonnes *Non commencée*, *En cours* et *Terminée*.
- **Chronogramme Gantt / Timeline :** Visualisation horizontale des durées de tâches et anticipation des chevauchements.
- **Vue Calendrier Mensuel :** Positionnement visuel des échéances calendaires avec modale rapide d'édition.
- **Vue Liste Tabulaire :** Tableau structuré avec tri par colonne et filtres multicritères (statut, priorité, projet, membre assigné, date).

### 2. ⚡ Synchronisation & Temps Réel (Socket.io)
- Propagation instantanée des changements d'état du Kanban sur tous les écrans connectés sans rechargement.
- Système de notifications push ciblées (`notification:new`) avec badge dynamique dans l'en-tête.
- Flux d'activités et journal d'audit en direct (`activity:new`).

### 3. 🛡️ Contrôle d'Accès & Sécurité (RBAC)
- **3 Niveaux de Rôles :** `Administrateur`, `Chef de projet` et `Employé`.
- Mots de passe chiffrés par **Bcrypt.js** avec 10 tours de salage dynamique.
- Sessions sécurisées par **JSON Web Tokens (JWT Bearer)** avec intercepteur Axios automatique.
- Garde-fous d'intégrité métier : interdiction de supprimer un projet contenant des tâches actives (**RG-02**) ou un employé avec des tâches en cours (**RG-15**).

### 4. 📁 Gestion Documentaire & Checklists
- **Pièces Jointes (Multer) :** Téléversement et suppression de documents et justificatifs jusqu'à 10 Mo par tâche.
- **Checklists de Sous-Tâches :** Découpage granulaire des tâches avec cochage interactif et suivi d'achèvement.
- **Fil de Discussion :** Commentaires horodatés pour la collaboration d'équipe.

### 5. 📈 Tableau de Bord Analytique & Export CSV
- 7 indicateurs de performance clés (KPIs) calculés en temps réel (total projets, tâches terminées, en cours, retards).
- Export instantané d'un rapport complet au format tableur **CSV**.

### 6. 🌐 Expérience 3D Interactive (Three.js WebGL)
- Noyau 3D interactif (*Guardian 3D*) réagissant en temps réel à 60 FPS aux interactions de l'utilisateur sur la page de connexion (lueur bleue, violette, verte ou rouge selon l'état de validation).

---

## 👥 Matrice des Rôles et Permissions (RBAC)

| Fonctionnalité | Visiteur | Employé | Chef de projet | Administrateur |
| :--- | :---: | :---: | :---: | :---: |
| Inscription & Connexion 3D | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil & mot de passe | ❌ | ✅ | ✅ | ✅ |
| Consulter le Dashboard (7 KPIs) & Export CSV | ❌ | ✅ | ✅ | ✅ |
| Vues Kanban, Gantt, Calendrier et Liste | ❌ | ✅ | ✅ | ✅ |
| Modifier le statut de ses tâches | ❌ | ✅ | ✅ | ✅ |
| Gérer sous-tâches, pièces jointes & commentaires | ❌ | ✅ | ✅ | ✅ |
| Créer, modifier et supprimer des projets | ❌ | ❌ | ✅ | ✅ |
| Créer, assigner et supprimer des tâches | ❌ | ❌ | ✅ | ✅ |
| Gérer l'annuaire des utilisateurs & rôles | ❌ | ❌ | ❌ | ✅ |
| Suppression sécurisée des comptes (RG-15) | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Installation et Démarrage Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/montassar088/Task.git
cd Task
```

### 2. Installer les dépendances
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Variables d'environnement
Créez le fichier `backend/.env` (ou copiez `backend/.env.example`) :
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/issat_project_management
JWT_SECRET=super_secret_jwt_key_issat_2026
```

### 4. Initialiser la base de données (Seed)
```bash
npm run seed --prefix backend
```
*Comptes de test préconfigurés (Mot de passe commun : `Password123!`) :*
- 🛡️ **Admin** : `admin@issat.tn`
- 👔 **Chef de projet** : `chef@issat.tn`
- 💼 **Employés** : `amira@issat.tn`, `yassine@issat.tn`

### 5. Lancer l'application (Commande unique)
À la racine du projet :
```bash
npm run dev
```
- **Application Web (Frontend)** : [http://localhost:5173](http://localhost:5173)
- **API REST & WebSockets (Backend)** : [http://localhost:5000](http://localhost:5000)

---

## 🧪 Tests Automatisés

La plateforme intègre **30 tests d'intégration automatisés** avec Jest et Supertest couvrant l'authentification, les règles RBAC, la gestion des projets, la validation des dates et le cycle de vie des tâches :

```bash
npm test --prefix backend
```

```
PASS tests/tasks.test.js
PASS tests/auth.test.js
PASS tests/projects.test.js
PASS tests/dashboard.test.js

Test Suites: 4 passed, 4 total
Tests:       30 passed, 30 total
Snapshots:   0 total
```

---

## 📐 Dossier de Conception & Architecture UML

Le projet dispose d'une documentation technique et d'ingénierie logicielle exhaustive :
- 📑 **Contexte Technique Maître :** [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md)
- 📚 **Dossier d'Architecture Complet (10 chapitres) :** [`technical-documentation/`](./technical-documentation/)
- 🖼️ **Diagramme des Cas d'Utilisation :** [`diagramme_cas_utilisation.drawio`](./diagramme_cas_utilisation.drawio) & [`diagramme_cas_utilisation.png`](./diagramme_cas_utilisation.png)
- 🖼️ **Diagrammes de Séquence (Global & Auth) :** [`diagramme_sequence_principal.drawio`](./diagramme_sequence_principal.drawio) & [`diagramme_sequence.png`](./diagramme_sequence.png)
- 📄 **Cahier des Charges Universitaire (6 pages) :** [`Cahier_Des_Charges_TaskFlow_3GLSI.pdf`](./Cahier_Des_Charges_TaskFlow_3GLSI.pdf) & [`.docx`](./Cahier_Des_Charges_TaskFlow_3GLSI.docx)

---

## 👨‍💻 Auteurs & Cadre Académique
- **Projet :** TaskFlow Web Application
- **Filière :** 3ème Année GLSI (Génie Logiciel et Systèmes d'Information)
- **Établissement :** Institut Supérieur des Sciences Appliquées et de Technologie de Kasserine (**ISSAT Kasserine**)
- **Enseignante Responsable :** Mme A. Yengui
