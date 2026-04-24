import { createContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    
    // API 클라이언트 헤더 명시적 제거
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const updateUser = (newInfo) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...newInfo } : newInfo;
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}
