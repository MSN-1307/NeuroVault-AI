import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('neurovault_user');
    return saved ? JSON.parse(saved) : {
      id: 1,
      name: 'Demo User',
      email: 'demo@neurovault.ai',
      role: 'USER',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('neurovault_token') || 'demo-token';
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('neurovault_token', newToken);
    localStorage.setItem('neurovault_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('neurovault_token');
    localStorage.removeItem('neurovault_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
