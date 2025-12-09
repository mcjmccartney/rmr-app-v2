'use client';

import React, { useState, useEffect } from 'react';
import { auditService, AuditLogEntry, AuditActionType, AuditEntityType } from '@/services/auditService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuditTrailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState<AuditActionType | ''>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchLogs();
  }, [user, router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filter: any = {};
      
      if (actionTypeFilter) filter.action_type = actionTypeFilter;
      if (entityTypeFilter) filter.entity_type = entityTypeFilter;
      if (startDate) filter.start_date = new Date(startDate).toISOString();
      if (endDate) filter.end_date = new Date(endDate).toISOString();
      
      const data = await auditService.getLogs(filter);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleClearFilters = () => {
    setActionTypeFilter('');
    setEntityTypeFilter('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    fetchLogs();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-50';
      case 'UPDATE': return 'text-blue-600 bg-blue-50';
      case 'DELETE': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.description?.toLowerCase().includes(searchLower) ||
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower)
    );
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Audit Trail</h1>
          <p className="text-gray-600 mb-6">
            Track all important operations in the system including session and client changes.
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value as AuditActionType | '')}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="EXPORT">Export</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value as AuditEntityType | '')}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Entities</option>
                <option value="SESSION">Session</option>
                <option value="CLIENT">Client</option>
                <option value="SESSION_PLAN">Session Plan</option>
                <option value="BOOKING_TERMS">Booking Terms</option>
                <option value="MEMBERSHIP">Membership</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by description, email, or entity ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={handleApplyFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
            >
              Clear
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-green-600 font-medium">Created</div>
              <div className="text-2xl font-bold text-green-700">
                {filteredLogs.filter(l => l.action_type === 'CREATE').length}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-blue-600 font-medium">Updated</div>
              <div className="text-2xl font-bold text-blue-700">
                {filteredLogs.filter(l => l.action_type === 'UPDATE').length}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-red-600 font-medium">Deleted</div>
              <div className="text-2xl font-bold text-red-700">
                {filteredLogs.filter(l => l.action_type === 'DELETE').length}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600 font-medium">Total</div>
              <div className="text-2xl font-bold text-gray-700">
                {filteredLogs.length}
              </div>
            </div>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">Timestamp</th>
                    <th className="text-left p-3 font-medium text-gray-700">Action</th>
                    <th className="text-left p-3 font-medium text-gray-700">Entity</th>
                    <th className="text-left p-3 font-medium text-gray-700">User</th>
                    <th className="text-left p-3 font-medium text-gray-700">Description</th>
                    <th className="text-left p-3 font-medium text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{formatDate(log.timestamp)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{log.entity_type}</td>
                        <td className="p-3 text-sm">{log.user_email || 'System'}</td>
                        <td className="p-3 text-sm">{log.description}</td>
                        <td className="p-3">
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id || null)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {expandedLog === log.id ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {log.old_values && (
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-2">Previous Values:</h4>
                                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-64">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-2">New Values:</h4>
                                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-64">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

