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
    return stored ? JSON.parse(stored) : [];
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
