'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import SlideUpModal from './SlideUpModal';
import { ActionPoint } from '@/types';
import { predefinedActionPoints } from '@/data/actionPoints';

interface ActionPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActionPointsModal({ isOpen, onClose }: ActionPointsModalProps) {
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>(predefinedActionPoints);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ header: '', details: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ header: '', details: '' });

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
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Action Points"
    >
      <div className="space-y-4">
        {/* Add New Action Point Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
            Add New Action Point
          </button>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-medium text-gray-900">Add New Action Point</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header
              </label>
              <input
                type="text"
                value={addForm.header}
                onChange={(e) => setAddForm({ ...addForm, header: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter action point header"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Details
              </label>
              <textarea
                value={addForm.details}
                onChange={(e) => setAddForm({ ...addForm, details: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter action point details (use [Dog Name], [he/she], [him/her] for personalization)"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={handleCancelAdd}
                className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Points List */}
        <div className="space-y-3">
          {actionPoints.map((actionPoint) => (
            <div key={actionPoint.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {editingId === actionPoint.id ? (
                // Edit Form
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Header
                    </label>
                    <input
                      type="text"
                      value={editForm.header}
                      onChange={(e) => setEditForm({ ...editForm, header: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Details
                    </label>
                    <textarea
                      value={editForm.details}
                      onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{actionPoint.header}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(actionPoint)}
                        className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(actionPoint.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{actionPoint.details}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {actionPoints.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No action points available</p>
          </div>
        )}
      </div>
    </SlideUpModal>
  );
}
