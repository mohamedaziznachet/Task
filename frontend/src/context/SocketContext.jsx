// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { showInfo } = useToast();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      if (user?._id) {
        socketInstance.emit('join_user', user._id);
      }
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    // Écouteur pour les notifications directes en temps réel
    socketInstance.on('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      showInfo(`🔔 ${notif.from} : ${notif.details || notif.targetTitle}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        clearNotifications,
        markAsRead,
        unreadCount: notifications.length,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
