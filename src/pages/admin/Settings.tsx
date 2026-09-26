import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Mail, Phone, Building, Globe, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    website: '',
    bio: '',
    notifications: true,
    darkMode: false,
    autoSave: true
  });

  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('user_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setFormData({
            name: parsed.name || user?.name || '',
            email: parsed.email || user?.email || '',
            phone: parsed.phone || '',
            company: parsed.company || '',
            website: parsed.website || '',
            bio: parsed.bio || '',
            notifications: parsed.notifications !== undefined ? parsed.notifications : true,
            darkMode: parsed.darkMode !== undefined ? parsed.darkMode : false,
            autoSave: parsed.autoSave !== undefined ? parsed.autoSave : true
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [user]);

  useEffect(() => {
    if (formData.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [formData.darkMode]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password changed successfully.');
      addToast('Password changed successfully!', 'success');
    } catch (error: any) {
      setPasswordMessage(error?.message || 'Unable to change password.');
      addToast(error?.message || 'Unable to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('user_settings', JSON.stringify(formData));
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (formData.name !== userData.name || formData.email !== userData.email) {
          userData.name = formData.name;
          userData.email = formData.email;
          localStorage.setItem('authUser', JSON.stringify(userData));
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaved(true);
      addToast('Settings saved successfully!', 'success');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      addToast('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /><span>Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4" />Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Mail className="w-4 h-4" />Email Address</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Phone className="w-4 h-4" />Phone Number</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Building className="w-4 h-4" />Company</label>
              <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Your company name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Globe className="w-4 h-4" />Website</label>
              <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://yourwebsite.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><Lock className="w-5 h-5" />Change Password</h2>
          <p className="text-sm text-gray-500 mb-6">Change the password for your current account. The new password is stored securely on the server.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PasswordField label="Current Password" value={passwordData.currentPassword} onChange={(value) => setPasswordData({ ...passwordData, currentPassword: value })} show={showCurrentPassword} toggle={() => setShowCurrentPassword(!showCurrentPassword)} />
            <PasswordField label="New Password" value={passwordData.newPassword} onChange={(value) => setPasswordData({ ...passwordData, newPassword: value })} show={showNewPassword} toggle={() => setShowNewPassword(!showNewPassword)} />
            <PasswordField label="Confirm New Password" value={passwordData.confirmPassword} onChange={(value) => setPasswordData({ ...passwordData, confirmPassword: value })} show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
          </div>
          {passwordMessage && <p className={`mt-4 text-sm ${passwordMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage}</p>}
          <div className="flex justify-end mt-6">
            <button type="submit" disabled={passwordLoading} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Email Notifications</p><p className="text-sm text-gray-500">Receive email updates about your projects</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.notifications} onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Dark Mode</p><p className="text-sm text-gray-500">Use dark theme for the interface</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.darkMode} onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Auto-save</p><p className="text-sm text-gray-500">Automatically save changes as you work</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.autoSave} onChange={(e) => setFormData({ ...formData, autoSave: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <motion.button whileHover={{ scale: loading ? 1 : 1.05 }} whileTap={{ scale: loading ? 1 : 0.95 }} type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>) : (<><Save className="w-5 h-5" />Save Changes</>)}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

const PasswordField: React.FC<{ label: string; value: string; onChange: (value: string) => void; show: boolean; toggle: () => void }> = ({ label, value, onChange, show, toggle }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input type={show ? 'text' : 'password'} required value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
      <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

export default AdminSettings;
