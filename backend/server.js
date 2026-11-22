require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();
const server = http.createServer(app);

// Initialisation de Socket.io pour la synchronisation temps réel
initSocket(server);

app.use(cors());
app.use(express.json());

// Servir les fichiers téléversés (Section 4 - Attachments)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activityRoutes);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow_management')
    .then(() => {
      console.log('✅ Connected to MongoDB');
      server.listen(PORT, () => console.log(`🚀 Server with Socket.io running on http://localhost:${PORT}`));
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));
}

module.exports = app;
