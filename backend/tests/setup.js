// backend/tests/setup.js
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/issat_test_db';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
};

const clearDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const closeDB = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_jwt_key_issat_2026', {
    expiresIn: '1d'
  });
};

const createTestUser = async ({ name, email, password = 'Password123!', role = 'Employé' }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role
  });
  const token = generateToken(user._id);
  return { user, token };
};

module.exports = {
  connectDB,
  clearDB,
  closeDB,
  generateToken,
  createTestUser
};
