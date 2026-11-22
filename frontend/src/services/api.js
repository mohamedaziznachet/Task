// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête : attache le token JWT si présent
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('issat_user');
  if (storedUser) {
    try {
      const { token } = JSON.parse(storedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      localStorage.removeItem('issat_user');
    }
  }
  return config;
});

// Intercepteur de réponse : gestion automatique de l'expiration du Token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Ignorer l'erreur 401 lors de la tentative de login
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('issat_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
