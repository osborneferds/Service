import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Search, Eye } from 'lucide-react';
import { useProjects, Project } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';

const AdminProjects: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState<{
    clientName: string; clientEmail: string; title: string; description: string;
    budget: string; timeline: string; category: string; priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'completed' | 'review'; progress: number; notes: string;
  }>({
    clientName: '', clientEmail: '', title: '', description: '',
    budget: '', timeline: '', category: '', priority: 'medium',
    status: 'pending', progress: 0, notes: ''
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateProject(editingProject.id, formData);
      addToast('Project updated!', 'success');
      setEditingProject(null);
    } else {
      addProject(formData);
      addToast('Project added!', 'success');
    }
    setShowAddModal(false);
    setFormData({ clientName: '', clientEmail: '', title: '', description: '', budget: '', timeline: '', category: '', priority: 'medium', status: 'pending', progress: 0, notes: '' });
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      clientName: project.clientName, clientEmail: project.clientEmail,
      title: project.title, description: project.description,
      budget: project.budget, timeline: project.timeline,
      category: project.category, priority: project.priority,
      status: project.status, progress: project.progress, notes: project.notes || ''
    });
    setShowAddModal(true);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all client projects</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setShowAddModal(true); setEditingProject(null); setFormData({ clientName: '', clientEmail: '', title: '', description: '', budget: '', timeline: '', category: '', priority: 'medium', status: 'pending', progress: 0, notes: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium">
          <Plus className="w-5 h-5" /> New Project
        </motion.button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <motion.tr key={project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{project.title}</p>
                    <p className="text-xs text-gray-500">{project.category}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{project.clientName}</p>
                    <p className="text-xs text-gray-500">{project.clientEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{project.budget}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingProject(project)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEditModal(project)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete this project?')) { deleteProject(project.id); addToast('Project deleted', 'info'); } }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProjects.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No projects found</p></div>}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{editingProject ? 'Edit Project' : 'Add Project'}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label><input type="text" required value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Client Email *</label><input type="email" required value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget *</label><input type="text" required value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="$5,000" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Timeline *</label><input type="text" required value={formData.timeline} onChange={(e) => setFormData({ ...formData, timeline: e.target.value })} placeholder="4 weeks" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><input type="text" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="completed">Completed</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Progress ({formData.progress}%)</label><input type="range" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })} className="w-full" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800">{editingProject ? 'Update' : 'Add'} Project</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingProject(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{viewingProject.title}</h2>
                <button onClick={() => setViewingProject(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Client</p><p className="font-semibold text-gray-900">{viewingProject.clientName}</p><p className="text-xs text-gray-500">{viewingProject.clientEmail}</p></div>
                  <div className="p-4 rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Budget</p><p className="font-semibold text-gray-900">{viewingProject.budget}</p></div>
                  <div className="p-4 rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Timeline</p><p className="font-semibold text-gray-900">{viewingProject.timeline}</p></div>
                  <div className="p-4 rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Category</p><p className="font-semibold text-gray-900">{viewingProject.category}</p></div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-sm text-gray-700">{viewingProject.description}</p></div>
                <div className="flex items-center gap-3">
                  <div className="p-4 rounded-xl bg-gray-50 flex-1"><p className="text-xs text-gray-500 mb-1">Status</p><span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[viewingProject.status]}`}>{viewingProject.status}</span></div>
                  <div className="p-4 rounded-xl bg-gray-50 flex-1"><p className="text-xs text-gray-500 mb-1">Priority</p><span className="text-sm font-semibold text-gray-900 capitalize">{viewingProject.priority}</span></div>
                  <div className="p-4 rounded-xl bg-gray-50 flex-1"><p className="text-xs text-gray-500 mb-1">Progress</p><p className="text-sm font-semibold text-gray-900">{viewingProject.progress}%</p></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProjects;
