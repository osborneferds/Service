import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ClientAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  company: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface ClientAccountsContextType {
  clientAccounts: ClientAccount[];
  addClientAccount: (account: Omit<ClientAccount, 'id' | 'createdAt'>) => void;
  updateClientAccount: (id: string, updates: Partial<ClientAccount>) => void;
  deleteClientAccount: (id: string) => void;
  validateClientCredentials: (email: string, password: string) => ClientAccount | null;
}

const ClientAccountsContext = createContext<ClientAccountsContextType | undefined>(undefined);

export const ClientAccountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>(() => {
    const stored = localStorage.getItem('freelancer_client_accounts');
    if (stored) {
      return JSON.parse(stored);
    }
    // Default client account
    return [
      {
        id: '1',
        email: 'client@demo.com',
        password: 'client123',
        name: 'John Smith',
        company: 'Demo Company',
        phone: '+1 555-0100',
        status: 'active',
        createdAt: new Date().toISOString(),
      }
    ];
  });

  const saveAccounts = (accounts: ClientAccount[]) => {
    setClientAccounts(accounts);
    localStorage.setItem('freelancer_client_accounts', JSON.stringify(accounts));
  };

  const addClientAccount = (account: Omit<ClientAccount, 'id' | 'createdAt'>) => {
    const newAccount: ClientAccount = {
      ...account,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    saveAccounts([...clientAccounts, newAccount]);
  };

  const updateClientAccount = (id: string, updates: Partial<ClientAccount>) => {
    const updated = clientAccounts.map(acc =>
      acc.id === id ? { ...acc, ...updates } : acc
    );
    saveAccounts(updated);
  };

  const deleteClientAccount = (id: string) => {
    saveAccounts(clientAccounts.filter(acc => acc.id !== id));
  };

  const validateClientCredentials = (email: string, password: string): ClientAccount | null => {
    return clientAccounts.find(
      acc => acc.email === email && acc.password === password && acc.status === 'active'
    ) || null;
  };

  return (
    <ClientAccountsContext.Provider value={{
      clientAccounts,
      addClientAccount,
      updateClientAccount,
      deleteClientAccount,
      validateClientCredentials,
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
