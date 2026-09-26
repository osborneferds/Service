import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Search, KeyRound, Shield } from 'lucide-react';
import { useClientAccounts, ClientAccount } from '../../context/ClientAccountsContext';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const AdminClientAccounts: React.FC = () => {
  const { clientAccounts, addClientAccount, updateClientAccount, deleteClientAccount } = useClientAccounts();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ClientAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<ClientAccount | null>(null);

  const [formData, setFormData] = useState({
    email: '', password: '', name: '', company: '', phone: '',
    status: 'active' as 'active' | 'inactive', notes: ''
  });

  const filteredAccounts = clientAccounts.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateClientAccount(editingAccount.id, formData);
        addToast('Account updated!', 'success');
        setEditingAccount(null);
      } else {
        await addClientAccount(formData);
        addToast('Account created!', 'success');
      }
      setShowAddModal(false);
      setFormData({ email: '', password: '', name: '', company: '', phone: '', status: 'active', notes: '' });
    } catch (error: any) {
      addToast(error?.message || 'Unable to save account', 'error');
    }
  };

  const openEditModal = (account: ClientAccount) => {
    setEditingAccount(account);
    setFormData({
      email: account.email, password: '', name: account.name,
      company: account.company, phone: account.phone, status: account.status, notes: account.notes || ''
    });
    setShowAddModal(true);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, password });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Accounts</h1>
          <p className="text-gray-600 mt-1">Manage client login credentials</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setShowAddModal(true); setEditingAccount(null); setFormData({ email: '', password: '', name: '', company: '', phone: '', status: 'active', notes: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium">
          <Plus className="w-5 h-5" /> Create Account
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><div><p className="text-2xl font-bold text-gray-900">{clientAccounts.length}</p><p className="text-sm text-gray-500">Total Accounts</p></div></div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><div><p className="text-2xl font-bold text-gray-900">{clientAccounts.filter(a => a.status === 'active').length}</p><p className="text-sm text-gray-500">Active</p></div></div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-500 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><div><p className="text-2xl font-bold text-gray-900">{clientAccounts.filter(a => a.status === 'inactive').length}</p><p className="text-sm text-gray-500">Inactive</p></div></div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search by name, email, or company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <motion.tr key={account.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {account.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div><p className="text-sm font-medium text-gray-900">{account.name}</p><p className="text-xs text-gray-500">{account.company}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-700">{account.email}</div></td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{account.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(account)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button
                        onClick={async () => {
                          const newPassword = window.prompt('Enter a new password for this client (minimum 8 characters):');
                          if (!newPassword) return;
                          if (newPassword.length < 8) {
                            addToast('Password must be at least 8 characters.', 'error');
                            return;
                          }
                          try {
                            await updateClientAccount(account.id, { password: newPassword });
                            addToast('Client password reset successfully.', 'success');
                          } catch (error: any) {
                            addToast(error?.message || 'Unable to reset password.', 'error');
                          }
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingAccount(account)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAccounts.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No client accounts found</p></div>}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{editingAccount ? 'Edit Account' : 'Create Account'}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="John Smith" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="client@example.com" /></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <div className="flex gap-2">
                      <input type="text" required={!editingAccount} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono" placeholder={editingAccount ? "Leave blank to keep current password" : "Password"} />
                      <button type="button" onClick={generatePassword} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium">Generate</button>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Company Name" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="+1 555-0100" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Additional notes..." /></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800">{editingAccount ? 'Update' : 'Create'} Account</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deletingAccount !== null}
        onClose={() => setDeletingAccount(null)}
        onConfirm={() => {
          if (deletingAccount) {
            deleteClientAccount(deletingAccount.id);
            addToast('Account deleted', 'info');
            setDeletingAccount(null);
          }
        }}
        title="Delete Client Account"
        message={`Are you sure you want to delete the account for "${deletingAccount?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminClientAccounts;
