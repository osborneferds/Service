import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';
import { LeadProvider } from './context/LeadContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { ClientAccountsProvider } from './context/ClientAccountsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientPortal from './pages/ClientPortal';
import NotFound from './pages/NotFound';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role: 'admin' | 'client' }> = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/client-portal'} replace />;
  }
  
  return <>{children}</>;
};

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ClientAccountsProvider>
          <ProjectProvider>
            <LeadProvider>
              <PortfolioProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                    <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
                    <Route path="/portfolio" element={<PublicLayout><Portfolio /></PublicLayout>} />
                    <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
                    <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
                    
                    <Route path="/client-portal" element={
                      <ProtectedRoute role="client">
                        <ClientPortal />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                      <ProtectedRoute role="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
                  </Routes>
                </Router>
              </PortfolioProvider>
            </LeadProvider>
          </ProjectProvider>
        </ClientAccountsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
