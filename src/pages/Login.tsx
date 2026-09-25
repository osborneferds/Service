import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Shield, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClientAccounts } from '../context/ClientAccountsContext';
import { useToast } from '../context/ToastContext';

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'client'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { validateClientCredentials } = useClientAccounts();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let success = false;
    
    if (activeTab === 'admin') {
      success = await login(email, password, 'admin');
    } else {
      // Validate client credentials
      const clientAccount = await validateClientCredentials(email, password);
      if (clientAccount) {
        success = await login(email, password, 'client');
      }
    }
    
    if (success) {
      addToast('Login successful!', 'success');
      navigate(activeTab === 'admin' ? '/admin' : '/client-portal');
    } else {
      addToast('Invalid credentials', 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <User className="w-4 h-4" />
              Client
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeTab === 'admin' ? 'Admin Login' : 'Client Portal'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {activeTab === 'admin' 
              ? 'Access the admin dashboard' 
              : 'Track your project progress'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder={activeTab === 'admin' ? 'admin@osborne.dev' : 'client@example.com'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
