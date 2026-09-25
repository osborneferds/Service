import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Building, FolderOpen, DollarSign } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';

const AdminClients: React.FC = () => {
  const { projects } = useProjects();

  const clients = Array.from(
    new Map(
      projects.map((p) => [
        p.clientEmail,
        {
          name: p.clientName,
          email: p.clientEmail,
          projects: projects.filter((proj) => proj.clientEmail === p.clientEmail),
        },
      ])
    ).values()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-600 mt-1">Manage your client relationships</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{clients.length}</p><p className="text-sm text-gray-500">Total Clients</p></div>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center"><DollarSign className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{projects.length}</p><p className="text-sm text-gray-500">Total Projects</p></div>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center"><DollarSign className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-gray-900">${projects.reduce((acc, p) => acc + parseInt(p.budget.replace(/[^0-9]/g, '') || '0'), 0).toLocaleString()}</p><p className="text-sm text-gray-500">Total Revenue</p></div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client) => {
          const totalBudget = client.projects.reduce((acc, p) => acc + parseInt(p.budget.replace(/[^0-9]/g, '') || '0'), 0);
          return (
            <motion.div key={client.email} whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {client.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-4 h-4" />{client.email}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div><div className="flex items-center gap-2 text-sm text-gray-600 mb-1"><FolderOpen className="w-4 h-4" />Projects</div><p className="text-2xl font-bold text-gray-900">{client.projects.length}</p></div>
                <div><div className="flex items-center gap-2 text-sm text-gray-600 mb-1"><DollarSign className="w-4 h-4" />Total Value</div><p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Recent Projects</p>
                <div className="space-y-2">
                  {client.projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate">{project.title}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${project.status === 'completed' ? 'bg-green-100 text-green-700' : project.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{project.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminClients;
