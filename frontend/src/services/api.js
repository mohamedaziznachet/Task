// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// قبل كل طلب، نثبتو إذا فما Token مسجل في المتصفح ونبعثوه للسيرفر
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('issat_user');
  if (storedUser) {
    const { token } = JSON.parse(storedUser);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;