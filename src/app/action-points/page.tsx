'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { ActionPoint } from '@/types';
import { predefinedActionPoints } from '@/data/actionPoints';

export default function ActionPointsPage() {
  const router = useRouter();
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>(predefinedActionPoints);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ header: '', details: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ header: '', details: '' });

  const handleBack = () => {
    router.push('/calendar');
  };

  const handleEdit = (actionPoint: ActionPoint) => {
    setEditingId(actionPoint.id);
    setEditForm({ header: actionPoint.header, details: actionPoint.details });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    
    setActionPoints(prev => prev.map(ap => 
      ap.id === editingId 
        ? { ...ap, header: editForm.header, details: editForm.details }
        : ap
    ));
    
    setEditingId(null);
    setEditForm({ header: '', details: '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ header: '', details: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this action point?')) {
      setActionPoints(prev => prev.filter(ap => ap.id !== id));
    }
  };

  const handleAdd = () => {
    if (!addForm.header.trim() || !addForm.details.trim()) return;
    
    const newActionPoint: ActionPoint = {
      id: Date.now().toString(),
      header: addForm.header,
      details: addForm.details
    };
    
    setActionPoints(prev => [...prev, newActionPoint]);
    setAddForm({ header: '', details: '' });
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddForm({ header: '', details: '' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            Manage Action Points
          </h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg p-6" style={{ backgroundColor: '#ebeadf' }}>
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
                    <input
                      type="text"
                      value={addForm.header}
                      onChange={(e) => setAddForm({ ...addForm, header: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
                      placeholder="Enter action point header"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Details
                    </label>
                    <textarea
                      value={addForm.details}
                      onChange={(e) => setAddForm({ ...addForm, details: e.target.value })}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                      placeholder="Enter action point details (use [Dog Name], [he/she], [him/her] for personalization)"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAdd}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors"
                      style={{ backgroundColor: '#973b00' }}
                    >
                      <Save size={16} />
                      Save
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
                {actionPoints.map((actionPoint) => (
                  <div key={actionPoint.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    {editingId === actionPoint.id ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Header
                          </label>
                          <input
                            type="text"
                            value={editForm.header}
                            onChange={(e) => setEditForm({ ...editForm, header: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Details
                          </label>
                          <textarea
                            value={editForm.details}
                            onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors"
                            style={{ backgroundColor: '#973b00' }}
                          >
                            <Save size={16} />
                            Save
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
                          <h4 className="font-medium text-gray-900 text-lg">{actionPoint.header}</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(actionPoint)}
                              className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(actionPoint.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{actionPoint.details}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {actionPoints.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No action points available</p>
                  <p className="text-gray-400 text-sm mt-2">Click "Add New Action Point" to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
