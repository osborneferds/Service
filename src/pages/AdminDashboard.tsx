import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Users, DollarSign, TrendingUp, LogOut, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useLeads } from '../context/LeadContext';
import { useClientAccounts } from '../context/ClientAccountsContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { leads, addLead, updateLead, deleteLead } = useLeads();
  const { clientAccounts } = useClientAccounts();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState<{
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
  }>({
    clientName: '',
    clientEmail: '',
    title: '',
    description: '',
    budget: '',
    timeline: '',
    status: 'pending',
    category: '',
    priority: 'medium',
    progress: 0,
  });

  const [leadForm, setLeadForm] = useState<{
    name: string;
    email: string;
    phone: string;
    company: string;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
    value: string;
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    status: 'new',
    value: '',
    notes: '',
  });

  const stats = [
    { label: 'Total Projects', value: projects.length.toString(), icon: FolderOpen, color: 'bg-blue-500' },
    { label: 'Active Clients', value: clientAccounts.filter(a => a.status === 'active').length.toString(), icon: Users, color: 'bg-purple-500' },
    { label: 'Total Leads', value: leads.length.toString(), icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Revenue', value: '$' + projects.reduce((sum, p) => sum + parseInt(p.budget.replace(/[^0-9]/g, '') || '0'), 0).toLocaleString(), icon: DollarSign, color: 'bg-orange-500' },
  ];

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateProject(editingProject, projectForm);
      addToast('Project updated successfully!', 'success');
      setEditingProject(null);
    } else {
      addProject(projectForm);
      addToast('Project added successfully!', 'success');
    }
    setProjectForm({
      clientName: '',
      clientEmail: '',
      title: '',
      description: '',
      budget: '',
      timeline: '',
      status: 'pending',
      category: '',
      priority: 'medium',
      progress: 0,
    });
    setShowAddProject(false);
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      updateLead(editingLead, leadForm);
      addToast('Lead updated successfully!', 'success');
      setEditingLead(null);
    } else {
      addLead(leadForm);
      addToast('Lead added successfully!', 'success');
    }
    setLeadForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      source: '',
      status: 'new',
      value: '',
      notes: '',
    });
    setShowAddLead(false);
  };

  const handleEditProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setProjectForm({
        clientName: project.clientName,
        clientEmail: project.clientEmail,
        title: project.title,
        description: project.description,
        budget: project.budget,
        timeline: project.timeline,
        status: project.status,
        category: project.category,
        priority: project.priority,
        progress: project.progress,
      });
      setEditingProject(id);
      setShowAddProject(true);
    }
  };

  const handleEditLead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      setLeadForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        status: lead.status,
        value: lead.value,
        notes: lead.notes,
      });
      setEditingLead(id);
      setShowAddLead(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Projects</h2>
            <button
              onClick={() => { setShowAddProject(true); setEditingProject(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>
          <div className="p-6">
            {projects.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No projects yet. Add your first project!</p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600">{project.clientName} - {project.clientEmail}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          project.status === 'completed' ? 'bg-green-100 text-green-700' :
                          project.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status}
                        </span>
                        <span className="text-sm text-gray-500">{project.budget}</span>
                        <span className="text-sm text-gray-500">{project.progress}% complete</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditProject(project.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this project?')) {
                            deleteProject(project.id);
                            addToast('Project deleted', 'info');
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leads Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Leads</h2>
            <button
              onClick={() => { setShowAddLead(true); setEditingLead(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>
          <div className="p-6">
            {leads.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No leads yet. Add your first lead!</p>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.email} - {lead.company}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          lead.status === 'won' ? 'bg-green-100 text-green-700' :
                          lead.status === 'lost' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {lead.status}
                        </span>
                        <span className="text-sm text-gray-500">{lead.value}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditLead(lead.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this lead?')) {
                            deleteLead(lead.id);
                            addToast('Lead deleted', 'info');
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Project Modal */}
      <AnimatePresence>
        {showAddProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddProject(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProject ? 'Edit Project' : 'Add Project'}
                </h2>
                <button onClick={() => setShowAddProject(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      required
                      value={projectForm.clientName}
                      onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                    <input
                      type="email"
                      required
                      value={projectForm.clientEmail}
                      onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <input
                      type="text"
                      required
                      value={projectForm.budget}
                      onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                      placeholder="$5,000"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                    <input
                      type="text"
                      required
                      value={projectForm.timeline}
                      onChange={(e) => setProjectForm({ ...projectForm, timeline: e.target.value })}
                      placeholder="4 weeks"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={projectForm.category}
                      onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={projectForm.priority}
                      onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress ({projectForm.progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={projectForm.progress}
                    onChange={(e) => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingProject ? 'Update' : 'Add'} Project
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Lead Modal */}
      <AnimatePresence>
        {showAddLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddLead(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingLead ? 'Edit Lead' : 'Add Lead'}
                </h2>
                <button onClick={() => setShowAddLead(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={leadForm.company}
                      onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <input
                      type="text"
                      value={leadForm.source}
                      onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                      placeholder="Website, Referral, etc."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="text"
                      value={leadForm.value}
                      onChange={(e) => setLeadForm({ ...leadForm, value: e.target.value })}
                      placeholder="$5,000"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddLead(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingLead ? 'Update' : 'Add'} Lead
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
