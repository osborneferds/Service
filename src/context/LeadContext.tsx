import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { leadsAPI, isBackendAvailable } from '../lib/api';

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
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status']) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  loading: boolean;
  backendAvailable: boolean;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    
    const available = await isBackendAvailable();
    setBackendAvailable(available);
    
    if (available) {
      try {
        const data = await leadsAPI.getAll();
        setLeads(data);
      } catch (error) {
        console.error('Failed to load leads from API, using localStorage');
        loadFromLocalStorage();
      }
    } else {
      console.log('Backend not available, using localStorage');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('freelancer_leads');
    if (stored) {
      try {
        setLeads(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse leads from localStorage');
        setLeads([]);
      }
    } else {
      setLeads([]);
    }
  };

  const saveLeads = async (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem('freelancer_leads', JSON.stringify(updatedLeads));
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    if (backendAvailable) {
      try {
        const created = await leadsAPI.create(lead);
        setLeads([...leads, created]);
      } catch (error) {
        console.error('Failed to add lead via API, using localStorage');
        await saveLeads([...leads, newLead]);
      }
    } else {
      await saveLeads([...leads, newLead]);
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const updated = leads.map(l => l.id === id ? { ...l, ...updates } : l);
    
    if (backendAvailable) {
      try {
        await leadsAPI.update(id, updates);
        setLeads(updated);
      } catch (error) {
        console.error('Failed to update lead via API, using localStorage');
        await saveLeads(updated);
      }
    } else {
      await saveLeads(updated);
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    await updateLead(id, { status });
  };

  const deleteLead = async (id: string) => {
    const filtered = leads.filter(l => l.id !== id);
    
    if (backendAvailable) {
      try {
        await leadsAPI.delete(id);
        setLeads(filtered);
      } catch (error) {
        console.error('Failed to delete lead via API, using localStorage');
        await saveLeads(filtered);
      }
    } else {
      await saveLeads(filtered);
    }
  };

  return (
    <LeadContext.Provider value={{
      leads,
      addLead,
      updateLead,
      updateLeadStatus,
      deleteLead,
      loading,
      backendAvailable,
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
