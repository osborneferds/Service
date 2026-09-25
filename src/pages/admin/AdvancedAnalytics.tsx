import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, FolderOpen, Clock, CheckCircle, AlertCircle, BarChart3, PieChart, Activity } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useLeads } from '../../context/LeadContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useClientAccounts } from '../../context/ClientAccountsContext';

const AdvancedAnalytics: React.FC = () => {
  const { projects } = useProjects();
  const { leads } = useLeads();
  const { invoices, getTotalRevenue, getPendingAmount } = useInvoices();
  const { clientAccounts } = useClientAccounts();

  // Calculate metrics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'won').length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  const totalRevenue = getTotalRevenue();
  const pendingAmount = getPendingAmount();
  const averageProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;

  const activeClients = clientAccounts.filter(c => c.status === 'active').length;

  // Monthly data for charts (mock data for now)
  const monthlyRevenue = [
    { month: 'Jan', revenue: 4500 },
    { month: 'Feb', revenue: 5200 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6100 },
    { month: 'May', revenue: 5800 },
    { month: 'Jun', revenue: 7200 },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(d => d.revenue));

  // Project status distribution
  const projectStatusData = [
    { status: 'Completed', count: completedProjects, color: 'bg-green-500' },
    { status: 'In Progress', count: activeProjects, color: 'bg-blue-500' },
    { status: 'Pending', count: projects.filter(p => p.status === 'pending').length, color: 'bg-gray-500' },
    { status: 'Review', count: projects.filter(p => p.status === 'review').length, color: 'bg-amber-500' },
  ];

  // Lead status distribution
  const leadStatusData = [
    { status: 'New', count: leads.filter(l => l.status === 'new').length, color: 'bg-orange-500' },
    { status: 'Contacted', count: leads.filter(l => l.status === 'contacted').length, color: 'bg-blue-500' },
    { status: 'Qualified', count: leads.filter(l => l.status === 'qualified').length, color: 'bg-purple-500' },
    { status: 'Proposal', count: leads.filter(l => l.status === 'proposal').length, color: 'bg-yellow-500' },
    { status: 'Won', count: wonLeads, color: 'bg-green-500' },
    { status: 'Lost', count: leads.filter(l => l.status === 'lost').length, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
        <p className="text-gray-600 mt-1">Comprehensive business insights and metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm opacity-90">Total Revenue</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs opacity-75">Pending: ${pendingAmount.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <FolderOpen className="w-8 h-8 opacity-80" />
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalProjects}</p>
          <p className="text-sm opacity-90">Total Projects</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs opacity-75">{completionRate.toFixed(1)}% completion rate</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">{activeClients}</p>
          <p className="text-sm opacity-90">Active Clients</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs opacity-75">{clientAccounts.length} total accounts</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">{conversionRate.toFixed(1)}%</p>
          <p className="text-sm opacity-90">Lead Conversion</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs opacity-75">{wonLeads} won from {totalLeads} leads</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Monthly Revenue</h3>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyRevenue.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg hover:from-indigo-700 hover:to-indigo-500 transition-all cursor-pointer relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${data.revenue.toLocaleString()}
                  </div>
                </motion.div>
                <span className="text-xs text-gray-500 font-medium">{data.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Project Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Project Status</h3>
              <p className="text-sm text-gray-500">Distribution by status</p>
            </div>
            <PieChart className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="space-y-4">
            {projectStatusData.map((item, index) => {
              const percentage = totalProjects > 0 ? (item.count / totalProjects) * 100 : 0;
              return (
                <motion.div
                  key={item.status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    </div>
                    <span className="text-sm text-gray-500">{item.count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Lead Pipeline & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Lead Pipeline</h3>
              <p className="text-sm text-gray-500">Status distribution</p>
            </div>
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {leadStatusData.map((item, index) => (
              <motion.div
                key={item.status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Performance Metrics</h3>
              <p className="text-sm text-gray-500">Key business indicators</p>
            </div>
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Average Project Value</p>
                  <p className="text-xs text-gray-500">Per completed project</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">${averageProjectValue.toFixed(0)}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Completion Rate</p>
                  <p className="text-xs text-gray-500">Projects completed</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Active Projects</p>
                  <p className="text-xs text-gray-500">Currently in progress</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{activeProjects}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pending Invoices</p>
                  <p className="text-xs text-gray-500">Awaiting payment</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">${pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Invoices Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invoice Summary</h3>
            <p className="text-sm text-gray-500">Payment status overview</p>
          </div>
          <DollarSign className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-900">
              {invoices.filter(i => i.status === 'paid').length}
            </p>
            <p className="text-xs text-green-600 mt-1">
              ${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-medium mb-1">Sent</p>
            <p className="text-2xl font-bold text-blue-900">
              {invoices.filter(i => i.status === 'sent').length}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ${invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-900">
              {invoices.filter(i => i.status === 'overdue').length}
            </p>
            <p className="text-xs text-red-600 mt-1">
              ${invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 font-medium mb-1">Draft</p>
            <p className="text-2xl font-bold text-gray-900">
              {invoices.filter(i => i.status === 'draft').length}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              ${invoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + i.total, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedAnalytics;
