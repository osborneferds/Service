import React from 'react';
import { useLeads } from '../../context/LeadContext';
import { motion } from 'framer-motion';

const AdminPipeline: React.FC = () => {
  const { leads, updateLeadStatus } = useLeads();

  const stages = [
    { id: 'new', name: 'New Leads', color: 'from-orange-500 to-orange-600' },
    { id: 'contacted', name: 'Contacted', color: 'from-blue-500 to-blue-600' },
    { id: 'qualified', name: 'Qualified', color: 'from-purple-500 to-purple-600' },
    { id: 'proposal', name: 'Proposal', color: 'from-yellow-500 to-yellow-600' },
    { id: 'won', name: 'Won', color: 'from-green-500 to-green-600' },
    { id: 'lost', name: 'Lost', color: 'from-red-500 to-red-600' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-gray-600 mt-1">Visual overview of your sales pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          const totalValue = stageLeads.reduce((sum, l) => sum + parseInt(l.value.replace(/[^0-9]/g, '') || '0'), 0);

          return (
            <div key={stage.id} className="space-y-3">
              <div className={`bg-gradient-to-r ${stage.color} rounded-lg p-3 text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                  <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">{stageLeads.length}</span>
                </div>
                <p className="text-xs mt-1 opacity-90">${totalValue.toLocaleString()}</p>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {stageLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                        <p className="text-xs text-gray-500 truncate">{lead.company}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{lead.email}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-900">{lead.value}</div>
                      {stage.id !== 'won' && stage.id !== 'lost' && (
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      )}
                    </div>
                  </motion.div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No leads</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPipeline;
