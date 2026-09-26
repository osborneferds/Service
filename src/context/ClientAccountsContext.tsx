import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clientAccountsAPI } from '../lib/api';
import { useAuth } from './AuthContext';

export interface ClientAccount {
  id: string;
  email: string;
  password?: string;
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
  loading: boolean;
  backendAvailable: boolean;
}

const ClientAccountsContext = createContext<ClientAccountsContextType | undefined>(undefined);

export const ClientAccountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const mapAccount = (a: any): ClientAccount => ({
    id: a.id,
    email: a.email,
    name: a.name,
    company: a.company || '',
    phone: a.phone || '',
    status: a.status,
    notes: a.notes || undefined,
    createdAt: a.createdAt || a.created_at || new Date().toISOString(),
  });

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await clientAccountsAPI.getAll();
      setClientAccounts((data || []).map(mapAccount));
      setBackendAvailable(true);
    } catch (error) {
      setBackendAvailable(false);
      console.error('Failed to load client accounts from backend:', error);
      setClientAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'staff')) loadAccounts();
    else {
      setClientAccounts([]);
      setBackendAvailable(false);
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  const addClientAccount = async (account: Omit<ClientAccount, 'id' | 'createdAt'>) => {
    if (!account.password) throw new Error('Password is required');
    const created = await clientAccountsAPI.create(account);
    setClientAccounts(prev => [mapAccount(created), ...prev]);
  };

  const updateClientAccount = async (id: string, updates: Partial<ClientAccount>) => {
    const payload = { ...updates };
    delete (payload as any).createdAt;
    delete (payload as any).password;
    if (updates.password) (payload as any).password = updates.password;

    const updated = await clientAccountsAPI.update(id, payload);
    setClientAccounts(prev => prev.map(acc => acc.id === id ? mapAccount(updated) : acc));
  };

  const deleteClientAccount = async (id: string) => {
    await clientAccountsAPI.delete(id);
    setClientAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  return (
    <ClientAccountsContext.Provider value={{
      clientAccounts,
      addClientAccount,
      updateClientAccount,
      deleteClientAccount,
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
