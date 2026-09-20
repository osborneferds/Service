import React, { useState } from 'react';
import { Link, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UserPlus, FolderKanban, FolderOpen,
  BarChart3, Settings, Menu, X, LogOut, ChevronRight,
  Bell, Code2, PanelLeftClose, PanelLeft, Building2, Image, Shield, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLeads } from '../context/LeadContext';
import { useProjects } from '../context/ProjectContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useClientAccounts } from '../context/ClientAccountsContext';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminLeads from '../pages/admin/Leads';
import AdminPipeline from '../pages/admin/Pipeline';
import AdminProjects from '../pages/admin/Projects';
import AdminClients from '../pages/admin/Clients';
import AdminClientAccounts from '../pages/admin/ClientAccounts';
import AdminPortfolio from '../pages/admin/PortfolioManagement';
import AdminAnalytics from '../pages/admin/Analytics';
import AdminSettings from '../pages/admin/Settings';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { leads } = useLeads();
  const { projects } = useProjects();
  const { portfolioItems } = usePortfolio();
  const { clientAccounts } = useClientAccounts();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true, badge: null },
    { path: '/admin/leads', icon: UserPlus, label: 'Leads', badge: leads.filter(l => l.status === 'new').length.toString() },
    { path: '/admin/pipeline', icon: FolderKanban, label: 'Pipeline', badge: null },
    { path: '/admin/projects', icon: FolderOpen, label: 'Projects', badge: projects.filter(p => p.status === 'in-progress').length.toString() },
    { path: '/admin/portfolio', icon: Image, label: 'Portfolio', badge: portfolioItems.length.toString() },
    { path: '/admin/client-accounts', icon: Shield, label: 'Client Accounts', badge: clientAccounts.filter(a => a.status === 'active').length.toString() },
    { path: '/admin/clients', icon: Building2, label: 'Clients', badge: null },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', badge: null },
    { path: '/admin/settings', icon: Settings, label: 'Settings', badge: null }
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const showFullContent = isMobile || sidebarOpen;

    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            {showFullContent && (
              <div>
                <span className="text-xl font-bold text-gray-900">
                  Osborne<span className="text-indigo-600">.dev</span>
                </span>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            )}
          </Link>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'A'}
            </div>
            {showFullContent && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {showFullContent && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                Main Menu
              </p>
            )}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative
                    ${active
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  style={{ minHeight: '48px' }}
                  title={!showFullContent ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
                  {showFullContent && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && item.badge !== '0' && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          active ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {active && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
            >
              {sidebarOpen ? (
                <>
                  <PanelLeftClose className="w-5 h-5" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <PanelLeft className="w-5 h-5" />
                  <span>Expand</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {showFullContent && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-900">
              {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <motion.aside
          animate={{ width: sidebarOpen ? 256 : 80 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden"
        >
          <SidebarContent />
        </motion.aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: -280, opacity: 0.8 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0.8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 h-full w-72 bg-white z-50 shadow-2xl"
              >
                <SidebarContent isMobile={true} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-8">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="pipeline" element={<AdminPipeline />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="client-accounts" element={<AdminClientAccounts />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
