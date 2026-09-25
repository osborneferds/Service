import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Project {
  id: string;
  clientName: string;
  clientEmail: string;
  title: string;
  description: string;
  budget: string;
  timeline: string;
  status: 'pending' | 'in-progress' | 'completed' | 'review';
  category: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  notes?: string;
  createdAt: string;
}

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectsByClient: (email: string) => Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = localStorage.getItem('freelancer_projects');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Sample projects for demo client
    return [
      {
        id: '1',
        clientName: 'John Smith',
        clientEmail: 'client@demo.com',
        title: 'E-commerce Website Redesign',
        description: 'Complete redesign of the online store with modern UI/UX, improved checkout flow, and mobile responsiveness.',
        budget: '$8,500',
        timeline: '6 weeks',
        status: 'in-progress',
        category: 'Web Development',
        priority: 'high',
        progress: 65,
        notes: 'Client prefers minimalist design with dark mode option',
        createdAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: '2',
        clientName: 'John Smith',
        clientEmail: 'client@demo.com',
        title: 'Mobile App Development',
        description: 'Cross-platform mobile application for iOS and Android with user authentication and real-time notifications.',
        budget: '$12,000',
        timeline: '10 weeks',
        status: 'pending',
        category: 'Mobile Development',
        priority: 'medium',
        progress: 15,
        notes: 'Waiting for final design approval',
        createdAt: '2024-01-20T00:00:00.000Z',
      },
      {
        id: '3',
        clientName: 'John Smith',
        clientEmail: 'client@demo.com',
        title: 'Brand Identity Package',
        description: 'Complete brand identity including logo design, color palette, typography, and brand guidelines document.',
        budget: '$3,200',
        timeline: '3 weeks',
        status: 'completed',
        category: 'Branding',
        priority: 'medium',
        progress: 100,
        notes: 'Project delivered on time. Client very satisfied.',
        createdAt: '2024-01-05T00:00:00.000Z',
      },
    ];
  });

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('freelancer_projects', JSON.stringify(updatedProjects));
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    saveProjects([...projects, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    saveProjects(updated);
  };

  const deleteProject = (id: string) => {
    saveProjects(projects.filter(p => p.id !== id));
  };

  const getProjectsByClient = (email: string) => {
    return projects.filter(p => p.clientEmail === email);
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      addProject,
      updateProject,
      deleteProject,
      getProjectsByClient,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within ProjectProvider');
  return context;
};
