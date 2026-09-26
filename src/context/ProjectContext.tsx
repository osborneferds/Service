import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectsAPI } from '../lib/api';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const mapProject = (p: any): Project => ({
    id: p.id,
    clientName: p.clientName ?? p.client_name ?? '',
    clientEmail: p.clientEmail ?? p.client_email ?? '',
    title: p.title,
    description: p.description,
    budget: p.budget,
    timeline: p.timeline,
    status: p.status,
    category: p.category,
    priority: p.priority,
    progress: Number(p.progress ?? 0),
    notes: p.notes ?? undefined,
    createdAt: p.createdAt ?? p.created_at ?? new Date().toISOString(),
  });

  useEffect(() => {
    if (user) loadProjects();
    else {
      setProjects([]);
      setBackendAvailable(false);
      setLoading(false);
    }
  }, [user?.id]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsAPI.getAll();
      setBackendAvailable(true);
      setProjects((data.projects || []).map(mapProject));
    } catch (error) {
      setBackendAvailable(false);
      console.error('Failed to load projects from backend:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const created = await projectsAPI.create({
        client_name: project.clientName,
        client_email: project.clientEmail,
        title: project.title,
        description: project.description,
        budget: project.budget,
        timeline: project.timeline,
        status: project.status,
        category: project.category,
        priority: project.priority,
        progress: project.progress,
        notes: project.notes,
      });
      setProjects(prev => [mapProject(created), ...prev]);
    } catch (error) {
      console.error('Failed to create project in backend:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const payload: any = {};
    if (updates.clientName !== undefined) payload.client_name = updates.clientName;
    if (updates.clientEmail !== undefined) payload.client_email = updates.clientEmail;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.budget !== undefined) payload.budget = updates.budget;
    if (updates.timeline !== undefined) payload.timeline = updates.timeline;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.progress !== undefined) payload.progress = updates.progress;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    try {
      const updated = await projectsAPI.update(id, payload);
      setProjects(prev => prev.map(p => p.id === id ? mapProject(updated) : p));
    } catch (error) {
      console.error('Failed to update project in backend:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project in backend:', error);
      throw error;
    }
  };

  const getProjectsByClient = (email: string) =>
    projects.filter(p => p.clientEmail.toLowerCase() === email.toLowerCase());

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
