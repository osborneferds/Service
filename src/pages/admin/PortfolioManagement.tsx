import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Search, Eye, Star, Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react';
import { usePortfolio, PortfolioItem } from '../../context/PortfolioContext';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const AdminPortfolioManagement: React.FC = () => {
  const { portfolioItems, addPortfolioItem, updatePortfolioItem, deletePortfolioItem } = usePortfolio();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'file'>('url');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '', category: 'web' as PortfolioItem['category'], description: '',
    tags: '', image: '', link: '', featured: false
  });

  const categories = ['all', 'web', 'design', 'mobile', 'branding'];

  const filteredItems = portfolioItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    if (editingItem) {
      updatePortfolioItem(editingItem.id, itemData);
      addToast('Portfolio item updated!', 'success');
      setEditingItem(null);
    } else {
      addPortfolioItem(itemData);
      addToast('Portfolio item added!', 'success');
    }
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ title: '', category: 'web', description: '', tags: '', image: '', link: '', featured: false });
    setImageUploadMode('url');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size must be less than 5MB', 'error');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData({ ...formData, image: base64 });
      setImagePreview(base64);
      addToast('Image uploaded successfully!', 'success');
    };
    reader.onerror = () => {
      addToast('Failed to upload image', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, image: url });
    setImagePreview(url);
  };

  const removeImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title, category: item.category, description: item.description,
      tags: item.tags.join(', '), image: item.image, link: item.link, featured: item.featured
    });
    
    // Detect if image is base64 or URL
    if (item.image.startsWith('data:image/')) {
      setImageUploadMode('file');
    } else {
      setImageUploadMode('url');
    }
    setImagePreview(item.image);
    setShowAddModal(true);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = { web: 'Web Development', design: 'UI/UX Design', mobile: 'Mobile App', branding: 'Branding' };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = { web: 'bg-blue-100 text-blue-700', design: 'bg-purple-100 text-purple-700', mobile: 'bg-green-100 text-green-700', branding: 'bg-orange-100 text-orange-700' };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Management</h1>
          <p className="text-gray-600 mt-1">Manage your portfolio projects</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setShowAddModal(true); setEditingItem(null); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium">
          <Plus className="w-5 h-5" /> Add Project
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100"><p className="text-sm text-gray-600 mb-1">Total Projects</p><p className="text-3xl font-bold text-gray-900">{portfolioItems.length}</p></div>
        <div className="bg-white rounded-xl p-6 border border-gray-100"><p className="text-sm text-gray-600 mb-1">Featured</p><p className="text-3xl font-bold text-gray-900">{portfolioItems.filter(p => p.featured).length}</p></div>
        <div className="bg-white rounded-xl p-6 border border-gray-100"><p className="text-sm text-gray-600 mb-1">Web Projects</p><p className="text-3xl font-bold text-gray-900">{portfolioItems.filter(p => p.category === 'web').length}</p></div>
        <div className="bg-white rounded-xl p-6 border border-gray-100"><p className="text-sm text-gray-600 mb-1">Design Projects</p><p className="text-3xl font-bold text-gray-900">{portfolioItems.filter(p => p.category === 'design').length}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
          {categories.map(cat => (<option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : getCategoryLabel(cat)}</option>))}
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Start by adding your first portfolio project</p>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium">
            <Plus className="w-5 h-5" /> Add Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-gray-100">
                {item.image ? (<img src={item.image} alt={item.title} className="w-full h-full object-cover" />) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
                )}
                {item.featured && (<div className="absolute top-3 left-3 px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full flex items-center gap-1"><Star className="w-3 h-3 fill-current" />Featured</div>)}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => { setPreviewItem(item); setShowPreviewModal(true); }} className="p-2 bg-white/90 hover:bg-white rounded-lg text-gray-700 hover:text-indigo-600 transition-all"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => openEditModal(item)} className="p-2 bg-white/90 hover:bg-white rounded-lg text-gray-700 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeletingItem(item)} className="p-2 bg-white/90 hover:bg-white rounded-lg text-gray-700 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(item.category)}`}>{getCategoryLabel(item.category)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((tag, index) => (<span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>))}
                  {item.tags.length > 3 && (<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">+{item.tags.length - 3}</span>)}
                </div>
                {item.link && (<a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">View Live</a>)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(showAddModal || editingItem) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowAddModal(false); setEditingItem(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{editingItem ? 'Edit Project' : 'Add New Project'}</h2>
                <button onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="E.g., E-commerce Platform" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as PortfolioItem['category'] })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"><option value="web">Web Development</option><option value="design">UI/UX Design</option><option value="mobile">Mobile App</option><option value="branding">Branding</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Brief description..." /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated) *</label><input type="text" required value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="React, Node.js, MongoDB" /></div>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Image *
                    <span className="ml-2 text-xs font-normal text-gray-500">(Upload file or paste URL)</span>
                  </label>
                  
                  {/* Toggle between URL and File upload */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImageUploadMode('url');
                        if (!formData.image.startsWith('data:image/')) {
                          setImagePreview(formData.image);
                        } else {
                          setImagePreview('');
                          setFormData({ ...formData, image: '' });
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        imageUploadMode === 'url'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUploadMode('file');
                        if (formData.image.startsWith('data:image/')) {
                          setImagePreview(formData.image);
                        } else {
                          setImagePreview('');
                          setFormData({ ...formData, image: '' });
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        imageUploadMode === 'file'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                  </div>

                  {/* URL Input */}
                  {imageUploadMode === 'url' && (
                    <input
                      type="url"
                      required
                      value={formData.image.startsWith('data:image/') ? '' : formData.image}
                      onChange={handleImageUrlChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  )}

                  {/* File Upload Input */}
                  {imageUploadMode === 'file' && (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">
                        Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
                      </p>
                    </div>
                  )}

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative group">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div><label className="block text-sm font-medium text-gray-700 mb-1">Live Demo Link</label><input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="https://yourproject.com" /></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><label htmlFor="featured" className="text-sm font-medium text-gray-700">Mark as Featured</label></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800">{editingItem ? 'Update' : 'Add'} Project</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreviewModal && previewItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreviewModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Project Preview</h2>
                <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden"><img src={previewItem.image} alt={previewItem.title} className="w-full h-full object-cover" /></div>
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{previewItem.title}</h3>
                    <span className={`px-3 py-1 rounded-md text-sm font-medium ${getCategoryColor(previewItem.category)}`}>{getCategoryLabel(previewItem.category)}</span>
                  </div>
                  {previewItem.featured && (<div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full mb-3"><Star className="w-4 h-4 fill-current" />Featured Project</div>)}
                  <p className="text-gray-600 mb-4">{previewItem.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">{previewItem.tags.map((tag, index) => (<span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg">{tag}</span>))}</div>
                  {previewItem.link && (<a href={previewItem.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Visit Live Site</a>)}
                  <p className="text-sm text-gray-500 mt-4">Added on: {new Date(previewItem.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) {
            deletePortfolioItem(deletingItem.id);
            addToast('Portfolio item deleted', 'info');
            setDeletingItem(null);
          }
        }}
        title="Delete Portfolio Item"
        message={`Are you sure you want to delete "${deletingItem?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminPortfolioManagement;
