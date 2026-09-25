import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectsAPI, isBackendAvailable } from '../lib/api';

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
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectsByClient: (email: string) => Project[];
  loading: boolean;
  backendAvailable: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Sample projects for demo
const sampleProjects: Project[] = [
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

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    
    // Check if backend is available
    const available = await isBackendAvailable();
    setBackendAvailable(available);
    
    if (available) {
      try {
        const data = await projectsAPI.getAll();
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Failed to load projects from API, using localStorage');
        loadFromLocalStorage();
      }
    } else {
      console.log('Backend not available, using localStorage');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('freelancer_projects');
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse projects from localStorage');
        setProjects(sampleProjects);
      }
    } else {
      // Use sample projects if nothing in localStorage
      setProjects(sampleProjects);
      localStorage.setItem('freelancer_projects', JSON.stringify(sampleProjects));
    }
  };

  const saveProjects = async (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('freelancer_projects', JSON.stringify(updatedProjects));
    
    // Sync with backend if available
    if (backendAvailable) {
      try {
        // This would require batch update API endpoint
        // For now, we just keep localStorage in sync
      } catch (error) {
        console.error('Failed to sync with backend');
      }
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    if (backendAvailable) {
      try {
        const created = await projectsAPI.create(project);
        setProjects([...projects, created]);
      } catch (error) {
        console.error('Failed to add project via API, using localStorage');
        await saveProjects([...projects, newProject]);
      }
    } else {
      await saveProjects([...projects, newProject]);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    
    if (backendAvailable) {
      try {
        await projectsAPI.update(id, updates);
        setProjects(updated);
      } catch (error) {
        console.error('Failed to update project via API, using localStorage');
        await saveProjects(updated);
      }
    } else {
      await saveProjects(updated);
    }
  };

  const deleteProject = async (id: string) => {
    const filtered = projects.filter(p => p.id !== id);
    
    if (backendAvailable) {
      try {
        await projectsAPI.delete(id);
        setProjects(filtered);
      } catch (error) {
        console.error('Failed to delete project via API, using localStorage');
        await saveProjects(filtered);
      }
    } else {
      await saveProjects(filtered);
    }
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
      loading,
      backendAvailable,
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
