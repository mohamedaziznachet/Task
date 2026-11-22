// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // كي يتحل الموقع، نثبتو إذا المستخدم مسجل الدخول من قبل
  useEffect(() => {
    const savedUser = localStorage.getItem('issat_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // دالة تسجيل الدخول (Login)
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data);
    localStorage.setItem('issat_user', JSON.stringify(response.data));
    return response.data;
  };

  // دالة إنشاء حساب جديد (Register)
  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    setUser(response.data);
    localStorage.setItem('issat_user', JSON.stringify(response.data));
    return response.data;
  };

  // دالة الخروج (Logout)
  const logout = () => {
    setUser(null);
    localStorage.removeItem('issat_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);