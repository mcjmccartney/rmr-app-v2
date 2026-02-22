'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { DogClubGuide } from '@/types';
import { useApp } from '@/context/AppContext';
import { useEnterKeyHandler } from '@/hooks/useEnterKeyHandler';
import Header from '@/components/layout/Header';

export default function DogClubGuidesPage() {
  const router = useRouter();
  const { state, createDogClubGuide, updateDogClubGuide, deleteDogClubGuide } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', url: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', url: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter guides based on search query
  const filteredGuides = state.dogClubGuides.filter(guide => {
    const searchTerm = searchQuery.toLowerCase();
    return guide.title.toLowerCase().includes(searchTerm) || guide.url.toLowerCase().includes(searchTerm);
  });

  const handleBack = () => {
    router.push('/calendar');
  };

  const handleEdit = (guide: DogClubGuide) => {
    setEditingId(guide.id);
    setEditForm({ title: guide.title, url: guide.url });
  };

  const handleSaveEdit = async () => {
    if (!editingId || isLoading) return;

    setIsLoading(true);
    try {
      await updateDogClubGuide(editingId, {
        title: editForm.title,
        url: editForm.url
      });
      setEditingId(null);
      setEditForm({ title: '', url: '' });
    } catch (error) {
      console.error('Error updating dog club guide:', error);
      alert('Failed to update dog club guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Enter key support for Save button when editing
  useEnterKeyHandler(
    handleSaveEdit,
    editingId !== null,
    [editingId]
  );

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', url: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dog club guide?')) return;

    setIsLoading(true);
    try {
      await deleteDogClubGuide(id);
    } catch (error) {
      console.error('Error deleting dog club guide:', error);
      alert('Failed to delete dog club guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.title.trim() || !addForm.url.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await createDogClubGuide({
        title: addForm.title,
        url: addForm.url
      });
      setAddForm({ title: '', url: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating dog club guide:', error);
      alert('Failed to create dog club guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddForm({ title: '', url: '' });
  };

  // Add Enter key support for Add button
  useEnterKeyHandler(
    handleAdd,
    showAddForm,
    [showAddForm]
  );

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#ebeadf' }}>
      {/* Header */}
      <Header
        title="Dog Club Guides"
        leftButton={{
          icon: ArrowLeft,
          onClick: handleBack,
          label: 'Back'
        }}
      />

      {/* Content */}
      <div className="flex-1 p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* Add New Guide Button */}
            {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#973b00' }}
                >
                  <Plus size={20} />
                  Add New Dog Club Guide
                </button>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white p-4 rounded-lg space-y-4 border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={addForm.title}
                      onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                      placeholder="Enter guide title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={addForm.url}
                      onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
                      placeholder="Enter guide URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAdd}
                      disabled={!addForm.title.trim() || !addForm.url.trim() || isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {isLoading ? 'Adding...' : 'Add Guide'}
                    </button>
                    <button
                      onClick={handleCancelAdd}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Guides List */}
            <div className="space-y-3">
              {filteredGuides.length === 0 ? (
                <div className="bg-white p-6 rounded-lg text-center text-gray-500 border border-gray-200">
                  {searchQuery ? 'No guides found matching your search.' : 'No dog club guides yet. Add one to get started!'}
                </div>
              ) : (
                filteredGuides.map((guide) => (
                  <div key={guide.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    {editingId === guide.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Enter guide title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL
                          </label>
                          <input
                            type="url"
                            value={editForm.url}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                            placeholder="Enter guide URL"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editForm.title.trim() || !editForm.url.trim() || isLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save size={18} />
                            {isLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                          >
                            <X size={18} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{guide.title}</h3>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(guide)}
                              className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(guide.id)}
                              disabled={isLoading}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <a
                          href={guide.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          {guide.url}
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


