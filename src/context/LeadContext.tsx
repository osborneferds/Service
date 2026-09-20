import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  value: string;
  notes: string;
  createdAt: string;
}

interface LeadContextType {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(() => {
    const stored = localStorage.getItem('freelancer_leads');
    return stored ? JSON.parse(stored) : [];
  });

  const saveLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem('freelancer_leads', JSON.stringify(updatedLeads));
  };

  const addLead = (lead: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    saveLeads([...leads, newLead]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    const updated = leads.map(l => l.id === id ? { ...l, ...updates } : l);
    saveLeads(updated);
  };

  const deleteLead = (id: string) => {
    saveLeads(leads.filter(l => l.id !== id));
  };

  return (
    <LeadContext.Provider value={{
      leads,
      addLead,
      updateLead,
      deleteLead,
    }}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) throw new Error('useLeads must be used within LeadProvider');
  return context;
};
