import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'client') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (error) {
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'client'): Promise<boolean> => {
    // Admin credentials
    if (role === 'admin' && email === 'admin@osborne.dev' && password === 'admin123') {
      const adminUser: User = { id: '1', name: 'Osborne Fernandes', email, role: 'admin' };
      setUser(adminUser);
      localStorage.setItem('authUser', JSON.stringify(adminUser));
      return true;
    }
    
    // Client credentials (from localStorage)
    if (role === 'client') {
      try {
        const accounts = JSON.parse(localStorage.getItem('freelancer_client_accounts') || '[]');
        const account = accounts.find((acc: any) => acc.email === email && acc.password === password && acc.status === 'active');
        
        if (account) {
          const clientUser: User = { id: account.id, name: account.name, email: account.email, role: 'client' };
          setUser(clientUser);
          localStorage.setItem('authUser', JSON.stringify(clientUser));
          return true;
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
