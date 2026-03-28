'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { ActionPoint } from '@/types';
import { useApp } from '@/context/AppContext';
import { useEnterKeyHandler } from '@/hooks/useEnterKeyHandler';
import RichTextEditor from '@/components/RichTextEditor';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';
import Header from '@/components/layout/Header';

export default function ActionPointsPage() {
  const router = useRouter();
  const { state, createActionPoint, updateActionPoint, deleteActionPoint } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ header: '', details: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ header: '', details: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter action points based on search query
  const filteredActionPoints = state.actionPoints.filter(actionPoint => {
    const searchTerm = searchQuery.toLowerCase();
    // Search in header (strip HTML tags for search)
    const headerText = actionPoint.header.replace(/<[^>]*>/g, '').toLowerCase();
    // Also search in details for more comprehensive search
    const detailsText = actionPoint.details.replace(/<[^>]*>/g, '').toLowerCase();
    return headerText.includes(searchTerm) || detailsText.includes(searchTerm);
  });

  const handleBack = () => {
    router.push('/calendar');
  };

  const handleEdit = (actionPoint: ActionPoint) => {
    setEditingId(actionPoint.id);
    setEditForm({ header: actionPoint.header, details: actionPoint.details });
  };

  const handleSaveEdit = async () => {
    if (!editingId || isLoading) return;

    setIsLoading(true);
    try {
      await updateActionPoint(editingId, {
        header: editForm.header,
        details: editForm.details
      });
      setEditingId(null);
      setEditForm({ header: '', details: '' });
    } catch (error) {
      console.error('Error updating action point:', error);
      alert('Failed to update action point. Please try again.');
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
    setEditForm({ header: '', details: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this action point?') || isLoading) return;

    setIsLoading(true);
    try {
      await deleteActionPoint(id);
    } catch (error) {
      console.error('Error deleting action point:', error);
      alert('Failed to delete action point. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.header.trim() || !addForm.details.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await createActionPoint({
        header: addForm.header,
        details: addForm.details
      });
      setAddForm({ header: '', details: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating action point:', error);
      alert('Failed to create action point. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddForm({ header: '', details: '' });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-amber-800">
        <Header
          title="Manage Action Points"
          buttons={[
            {
              icon: ArrowLeft,
              onClick: handleBack,
              title: 'Back to Calendar',
              iconOnly: true
            }
          ]}
          showSearch
          onSearch={setSearchQuery}
          searchPlaceholder="Search action points..."
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* Add New Action Point Button */}
            {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#973b00' }}
                >
                  <Plus size={20} />
                  Add New Action Point
                </button>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white p-4 rounded-lg space-y-4 border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Header
                    </label>
                    <RichTextEditor
                      value={addForm.header}
                      onChange={(value) => setAddForm({ ...addForm, header: value })}
                      placeholder="Enter action point header"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Details
                    </label>
                    <RichTextEditor
                      value={addForm.details}
                      onChange={(value) => setAddForm({ ...addForm, details: value })}
                      placeholder="Enter action point details (use [Dog Name], [he/she], [him/her] for personalization)"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAdd}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#973b00' }}
                    >
                      <Save size={16} />
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelAdd}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
            )}

            {/* Action Points List */}
            <div className="space-y-4">
              {filteredActionPoints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchQuery ? 'No action points found matching your search.' : 'No action points yet.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-amber-600 hover:text-amber-700 underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredActionPoints.map((actionPoint) => (
                  <div key={actionPoint.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    {editingId === actionPoint.id ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Header
                          </label>
                          <RichTextEditor
                            value={editForm.header}
                            onChange={(value) => setEditForm({ ...editForm, header: value })}
                            placeholder="Enter action point header"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Details
                          </label>
                          <RichTextEditor
                            value={editForm.details}
                            onChange={(value) => setEditForm({ ...editForm, details: value })}
                            placeholder="Enter action point details"
                            className="w-full"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                            style={{ backgroundColor: '#973b00' }}
                          >
                            <Save size={16} />
                            {isLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <SafeHtmlRenderer
                            html={actionPoint.header}
                            className="font-medium text-gray-900 text-lg flex-1"
                            fallback={actionPoint.header}
                          />
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(actionPoint)}
                              className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(actionPoint.id)}
                              disabled={isLoading}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <SafeHtmlRenderer
                          html={actionPoint.details}
                          className="text-gray-600 leading-relaxed"
                          fallback={actionPoint.details}
                        />
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
