import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { portfolioAPI, isBackendAvailable } from '../lib/api';

export interface PortfolioItem {
  id: string;
  title: string;
  category: 'web' | 'design' | 'mobile' | 'branding';
  description: string;
  tags: string[];
  image: string;
  link: string;
  featured: boolean;
  createdAt: string;
}

interface PortfolioContextType {
  portfolioItems: PortfolioItem[];
  addPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => Promise<void>;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  loading: boolean;
  backendAvailable: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    loadPortfolioItems();
  }, []);

  const loadPortfolioItems = async () => {
    setLoading(true);
    
    const available = await isBackendAvailable();
    setBackendAvailable(available);
    
    if (available) {
      try {
        const data = await portfolioAPI.getAll();
        setPortfolioItems(data);
      } catch (error) {
        console.error('Failed to load portfolio from API, using localStorage');
        loadFromLocalStorage();
      }
    } else {
      console.log('Backend not available, using localStorage');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('freelancer_portfolio');
    if (stored) {
      try {
        setPortfolioItems(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse portfolio from localStorage');
        setPortfolioItems([]);
      }
    } else {
      setPortfolioItems([]);
    }
  };

  const savePortfolioItems = async (items: PortfolioItem[]) => {
    setPortfolioItems(items);
    localStorage.setItem('freelancer_portfolio', JSON.stringify(items));
  };

  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    const newItem: PortfolioItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    if (backendAvailable) {
      try {
        const created = await portfolioAPI.create(item);
        setPortfolioItems([...portfolioItems, created]);
      } catch (error) {
        console.error('Failed to add portfolio item via API, using localStorage');
        await savePortfolioItems([...portfolioItems, newItem]);
      }
    } else {
      await savePortfolioItems([...portfolioItems, newItem]);
    }
  };

  const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>) => {
    const updated = portfolioItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    
    if (backendAvailable) {
      try {
        await portfolioAPI.update(id, updates);
        setPortfolioItems(updated);
      } catch (error) {
        console.error('Failed to update portfolio item via API, using localStorage');
        await savePortfolioItems(updated);
      }
    } else {
      await savePortfolioItems(updated);
    }
  };

  const deletePortfolioItem = async (id: string) => {
    const filtered = portfolioItems.filter(item => item.id !== id);
    
    if (backendAvailable) {
      try {
        await portfolioAPI.delete(id);
        setPortfolioItems(filtered);
      } catch (error) {
        console.error('Failed to delete portfolio item via API, using localStorage');
        await savePortfolioItems(filtered);
      }
    } else {
      await savePortfolioItems(filtered);
    }
  };

  return (
    <PortfolioContext.Provider value={{
      portfolioItems,
      addPortfolioItem,
      updatePortfolioItem,
      deletePortfolioItem,
      loading,
      backendAvailable,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
  return context;
};
