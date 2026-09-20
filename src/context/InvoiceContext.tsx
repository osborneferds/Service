import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

interface InvoiceContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  markAsPaid: (id: string) => void;
  getInvoicesByClient: (clientId: string) => Invoice[];
  getTotalRevenue: () => number;
  getPendingAmount: () => number;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem('freelancer_invoices');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
    return [];
  });

  const saveInvoices = (items: Invoice[]) => {
    setInvoices(items);
    localStorage.setItem('freelancer_invoices', JSON.stringify(items));
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.filter(inv => inv.invoiceNumber.startsWith(`INV-${year}`)).length + 1;
    return `INV-${year}-${String(count).padStart(4, '0')}`;
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date().toISOString(),
    };
    saveInvoices([newInvoice, ...invoices]);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    const updated = invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv);
    saveInvoices(updated);
  };

  const deleteInvoice = (id: string) => {
    saveInvoices(invoices.filter(inv => inv.id !== id));
  };

  const markAsPaid = (id: string) => {
    const updated = invoices.map(inv =>
      inv.id === id ? { ...inv, status: 'paid' as const, paidDate: new Date().toISOString() } : inv
    );
    saveInvoices(updated);
  };

  const getInvoicesByClient = (clientId: string) => {
    return invoices.filter(inv => inv.clientId === clientId);
  };

  const getTotalRevenue = () => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
  };

  const getPendingAmount = () => {
    return invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);
  };

  return (
    <InvoiceContext.Provider value={{
      invoices,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      markAsPaid,
      getInvoicesByClient,
      getTotalRevenue,
      getPendingAmount,
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (!context) throw new Error('useInvoices must be used within InvoiceProvider');
  return context;
};
