import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clientAccountsAPI, isBackendAvailable } from '../lib/api';

export interface ClientAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  company: string;
  phone: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

interface ClientAccountsContextType {
  clientAccounts: ClientAccount[];
  addClientAccount: (account: Omit<ClientAccount, 'id' | 'createdAt'>) => Promise<void>;
  updateClientAccount: (id: string, updates: Partial<ClientAccount>) => Promise<void>;
  deleteClientAccount: (id: string) => Promise<void>;
  validateClientCredentials: (email: string, password: string) => Promise<ClientAccount | null>;
  loading: boolean;
  backendAvailable: boolean;
}

const ClientAccountsContext = createContext<ClientAccountsContextType | undefined>(undefined);

// Default client account for demo
const defaultClientAccount: ClientAccount = {
  id: '1',
  email: 'client@demo.com',
  password: 'client123',
  name: 'John Smith',
  company: 'Demo Company',
  phone: '+1 555-0100',
  status: 'active',
  notes: 'Default demo client account',
  createdAt: new Date().toISOString(),
};

export const ClientAccountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    
    const available = await isBackendAvailable();
    setBackendAvailable(available);
    
    if (available) {
      try {
        const data = await clientAccountsAPI.getAll();
        setClientAccounts(data);
      } catch (error) {
        console.error('Failed to load client accounts from API, using localStorage');
        loadFromLocalStorage();
      }
    } else {
      console.log('Backend not available, using localStorage');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('freelancer_client_accounts');
    if (stored) {
      try {
        setClientAccounts(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse client accounts from localStorage');
        setClientAccounts([defaultClientAccount]);
      }
    } else {
      setClientAccounts([defaultClientAccount]);
      localStorage.setItem('freelancer_client_accounts', JSON.stringify([defaultClientAccount]));
    }
  };

  const saveAccounts = async (accounts: ClientAccount[]) => {
    setClientAccounts(accounts);
    localStorage.setItem('freelancer_client_accounts', JSON.stringify(accounts));
  };

  const addClientAccount = async (account: Omit<ClientAccount, 'id' | 'createdAt'>) => {
    const newAccount: ClientAccount = {
      ...account,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    if (backendAvailable) {
      try {
        const created = await clientAccountsAPI.create(account);
        setClientAccounts([...clientAccounts, created]);
      } catch (error) {
        console.error('Failed to add client account via API, using localStorage');
        await saveAccounts([...clientAccounts, newAccount]);
      }
    } else {
      await saveAccounts([...clientAccounts, newAccount]);
    }
  };

  const updateClientAccount = async (id: string, updates: Partial<ClientAccount>) => {
    const updated = clientAccounts.map(acc => 
      acc.id === id ? { ...acc, ...updates } : acc
    );
    
    if (backendAvailable) {
      try {
        await clientAccountsAPI.update(id, updates);
        setClientAccounts(updated);
      } catch (error) {
        console.error('Failed to update client account via API, using localStorage');
        await saveAccounts(updated);
      }
    } else {
      await saveAccounts(updated);
    }
  };

  const deleteClientAccount = async (id: string) => {
    const filtered = clientAccounts.filter(acc => acc.id !== id);
    
    if (backendAvailable) {
      try {
        await clientAccountsAPI.delete(id);
        setClientAccounts(filtered);
      } catch (error) {
        console.error('Failed to delete client account via API, using localStorage');
        await saveAccounts(filtered);
      }
    } else {
      await saveAccounts(filtered);
    }
  };

  const validateClientCredentials = async (email: string, password: string): Promise<ClientAccount | null> => {
    if (backendAvailable) {
      try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'client' })
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.user;
        }
        return null;
      } catch (error) {
        console.error('Failed to validate credentials via API');
      }
    }
    
    // Fallback to localStorage validation
    const account = clientAccounts.find(acc => acc.email === email && acc.password === password && acc.status === 'active');
    return account || null;
  };

  return (
    <ClientAccountsContext.Provider value={{
      clientAccounts,
      addClientAccount,
      updateClientAccount,
      deleteClientAccount,
      validateClientCredentials,
      loading,
      backendAvailable,
    }}>
      {children}
    </ClientAccountsContext.Provider>
  );
};

export const useClientAccounts = () => {
  const context = useContext(ClientAccountsContext);
  if (!context) throw new Error('useClientAccounts must be used within ClientAccountsProvider');
  return context;
};
