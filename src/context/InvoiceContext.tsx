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
    
    // Sample invoices for demo client
    return [
      {
        id: '1',
        invoiceNumber: 'INV-2024-0001',
        clientId: '1',
        clientName: 'John Smith',
        clientEmail: 'client@demo.com',
        projectName: 'E-commerce Website Redesign',
        items: [
          { description: 'UI/UX Design', quantity: 1, rate: 2500, amount: 2500 },
          { description: 'Frontend Development', quantity: 1, rate: 3500, amount: 3500 },
        ],
        subtotal: 6000,
        tax: 600,
        total: 6600,
        status: 'paid',
        issueDate: '2024-01-10',
        dueDate: '2024-01-25',
        paidDate: '2024-01-20',
        notes: 'Thank you for your prompt payment!',
        createdAt: '2024-01-10T00:00:00.000Z',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-0002',
        clientId: '1',
        clientName: 'John Smith',
        clientEmail: 'client@demo.com',
        projectName: 'Mobile App Development',
        items: [
          { description: 'App Development - Phase 1', quantity: 1, rate: 5000, amount: 5000 },
          { description: 'Testing & QA', quantity: 1, rate: 1500, amount: 1500 },
        ],
        subtotal: 6500,
        tax: 650,
        total: 7150,
        status: 'sent',
        issueDate: '2024-01-25',
        dueDate: '2024-02-10',
        notes: 'Payment due within 15 days',
        createdAt: '2024-01-25T00:00:00.000Z',
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-0003',
        clientId: '1',
        clientName: 'John Smith',
        clientEmail: 'client@demo.com',
        projectName: 'Brand Identity Package',
        items: [
          { description: 'Logo Design', quantity: 1, rate: 1500, amount: 1500 },
          { description: 'Brand Guidelines', quantity: 1, rate: 1000, amount: 1000 },
          { description: 'Business Card Design', quantity: 1, rate: 500, amount: 500 },
        ],
        subtotal: 3000,
        tax: 300,
        total: 3300,
        status: 'paid',
        issueDate: '2024-01-05',
        dueDate: '2024-01-20',
        paidDate: '2024-01-15',
        createdAt: '2024-01-05T00:00:00.000Z',
      },
    ];
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
