# 🚀 Task & Project Management App (MERN Stack)
### ISSAT Kasserine • 3 GLSI

Plateforme web moderne de gestion de projets et de tâches avec contrôle d'accès basé sur les rôles (RBAC) et interface interactive 3D Three.js.

---

## 🛠️ Stack Technique
- **Frontend** : React 19, Vite, Tailwind CSS, Lucide Icons, Three.js (Guardian 3D).
- **Backend** : Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt.
- **Tests & Qualité** : Jest, Supertest.

---

## 👥 Rôles et Permissions
1. **Administrateur** :
   - Gestion totale des utilisateurs (modification des rôles, promotion en Chef de projet ou Administrateur).
   - Création et suppression de projets et de tâches.
   - Protection de suppression : un employé ayant des tâches "En cours" ne peut pas être supprimé.
2. **Chef de projet** :
   - Création et gestion de projets et tâches.
   - Affectation des tâches aux employés.
3. **Employé** :
   - Rôle attribué automatiquement et obligatoirement à toute inscription publique.
   - Suivi et mise à jour du statut de ses tâches (*Non commencée*, *En cours*, *Terminée*).
   - Recalcul automatique du statut des projets selon l'avancement des tâches.

---

## ⚡ Démarrage Rapide (Commande Unique)

### 1. Installation des dépendances
```bash
# Dans le dossier backend
cd backend && npm install

# Dans le dossier frontend
cd ../frontend && npm install
```

### 2. Configuration des variables d'environnement
Créez un fichier `backend/.env` (voir `backend/.env.example`) :
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/issat_project_management
JWT_SECRET=super_secret_jwt_key_issat_2026
```

### 3. Peupler la base de données (Seed)
```bash
npm run seed --prefix backend
```
*Comptes de test créés (Mot de passe commun : `Password123!`) :*
- **Admin** : `admin@issat.tn`
- **Chef de projet** : `chef@issat.tn`
- **Employés** : `amira@issat.tn`, `yassine@issat.tn`

### 4. Lancer le Frontend et le Backend en une seule commande
À la racine du projet :
```bash
npm run dev
```
- **Frontend** : http://localhost:5173
- **Backend** : http://localhost:5000

---

## 🧪 Tests Automatisés
Pour exécuter la suite de tests (30 tests couvrant l'authentification, la sécurité des rôles, les projets et les tâches) :
```bash
npm test --prefix backend
```
