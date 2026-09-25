import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  addPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => void;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => void;
  deletePortfolioItem: (id: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(() => {
    const stored = localStorage.getItem('freelancer_portfolio');
    return stored ? JSON.parse(stored) : [];
  });

  const savePortfolio = (items: PortfolioItem[]) => {
    setPortfolioItems(items);
    localStorage.setItem('freelancer_portfolio', JSON.stringify(items));
  };

  const addPortfolioItem = (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    const newItem: PortfolioItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    savePortfolio([...portfolioItems, newItem]);
  };

  const updatePortfolioItem = (id: string, updates: Partial<PortfolioItem>) => {
    const updated = portfolioItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    savePortfolio(updated);
  };

  const deletePortfolioItem = (id: string) => {
    savePortfolio(portfolioItems.filter(item => item.id !== id));
  };

  return (
    <PortfolioContext.Provider value={{
      portfolioItems,
      addPortfolioItem,
      updatePortfolioItem,
      deletePortfolioItem,
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
