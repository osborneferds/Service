import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, FolderOpen, DollarSign, ArrowUpRight } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useLeads } from '../../context/LeadContext';

const AdminAnalytics: React.FC = () => {
  const { projects } = useProjects();
  const { leads } = useLeads();

  const totalRevenue = projects.reduce((acc, p) => acc + parseInt(p.budget.replace(/[^0-9]/g, '') || '0'), 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const wonLeads = leads.filter(l => l.status === 'won').length;
  const conversionRate = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(1) : '0';

  const categoryStats = projects.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = [
    { month: 'Jan', revenue: 4000, projects: 3 },
    { month: 'Feb', revenue: 3000, projects: 2 },
    { month: 'Mar', revenue: 5000, projects: 4 },
    { month: 'Apr', revenue: 4500, projects: 3 },
    { month: 'May', revenue: 6000, projects: 5 },
    { month: 'Jun', revenue: 5500, projects: 4 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your business performance and growth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2"><ArrowUpRight className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-500">+12.5%</span><span className="text-sm text-gray-500">vs last month</span></div>
            </div>
            <div className="bg-green-500 p-3 rounded-lg"><DollarSign className="w-6 h-6 text-white" /></div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{activeProjects}</p>
              <div className="flex items-center gap-1 mt-2"><ArrowUpRight className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-500">+3</span><span className="text-sm text-gray-500">this month</span></div>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg"><FolderOpen className="w-6 h-6 text-white" /></div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{completedProjects}</p>
              <div className="flex items-center gap-1 mt-2"><ArrowUpRight className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-500">+20%</span><span className="text-sm text-gray-500">completion rate</span></div>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg"><TrendingUp className="w-6 h-6 text-white" /></div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
              <div className="flex items-center gap-1 mt-2"><ArrowUpRight className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-500">+5%</span><span className="text-sm text-gray-500">lead conversion</span></div>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg"><Users className="w-6 h-6 text-white" /></div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Monthly Revenue</h2>
        <div className="h-64 flex items-end justify-between gap-4 px-4">
          {monthlyData.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md hover:from-indigo-700 hover:to-indigo-500 transition-all cursor-pointer relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${item.revenue.toLocaleString()}
                  </div>
                </motion.div>
                <span className="text-xs text-gray-500 font-medium">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Projects by Category</h2>
        <div className="space-y-4">
          {Object.entries(categoryStats).map(([category, count]) => {
            const percentage = (count / projects.length) * 100;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <span className="text-sm text-gray-500">{count} projects ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8 }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Lead Pipeline Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'New', count: leads.filter(l => l.status === 'new').length, color: 'bg-orange-500' },
            { label: 'Contacted', count: leads.filter(l => l.status === 'contacted').length, color: 'bg-blue-500' },
            { label: 'Qualified', count: leads.filter(l => l.status === 'qualified').length, color: 'bg-purple-500' },
            { label: 'Proposal', count: leads.filter(l => l.status === 'proposal').length, color: 'bg-yellow-500' },
            { label: 'Won', count: leads.filter(l => l.status === 'won').length, color: 'bg-green-500' },
            { label: 'Lost', count: leads.filter(l => l.status === 'lost').length, color: 'bg-red-500' }
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full ${item.color} flex items-center justify-center text-white text-2xl font-bold mb-2`}>{item.count}</div>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
