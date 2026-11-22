// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérification de la session au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('issat_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('issat_user');
      }
    }
    setLoading(false);

    // Écouteur pour expiration de session (401 intercepté par Axios)
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // Connexion (Login)
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data);
    localStorage.setItem('issat_user', JSON.stringify(response.data));
    return response.data;
  };

  // Inscription (Register)
  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    setUser(response.data);
    localStorage.setItem('issat_user', JSON.stringify(response.data));
    return response.data;
  };

  // Mise à jour du profil (Nom et/ou Mot de passe)
  const updateProfile = async ({ name, currentPassword, newPassword }) => {
    const response = await api.put('/auth/profile', { name, currentPassword, newPassword });
    setUser(response.data);
    localStorage.setItem('issat_user', JSON.stringify(response.data));
    return response.data;
  };

  // Déconnexion (Logout)
  const logout = () => {
    setUser(null);
    localStorage.removeItem('issat_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
