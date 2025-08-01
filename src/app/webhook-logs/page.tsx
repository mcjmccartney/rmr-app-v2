'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Membership {
  id: string;
  email: string;
  date: string;
  amount: number;
  created_at?: string;
}

export default function WebhookLogsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [sessionTestResult, setSessionTestResult] = useState<any>(null);
  const [sessionTesting, setSessionTesting] = useState(false);

  useEffect(() => {
    fetchRecentMemberships();
  }, []);

  const fetchRecentMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching memberships:', error);
      } else {
        setMemberships(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/stripe/webhook/test');
      const result = await response.json();
      setTestResult(result);

      // Refresh the memberships list after test
      setTimeout(() => {
        fetchRecentMemberships();
      }, 1000);
    } catch (error) {
      setTestResult({
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const runSessionTest = async () => {
    setSessionTesting(true);
    setSessionTestResult(null);

    try {
      const response = await fetch('/api/test-session-webhook');
      const result = await response.json();
      setSessionTestResult(result);
    } catch (error) {
      setSessionTestResult({
        error: 'Session test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSessionTesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Webhook Logs & Testing</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Webhook Endpoints</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Stripe Payments:</span>
                <code className="bg-gray-100 p-2 rounded text-sm block">
                  https://raising-my-rescue.vercel.app/api/stripe/webhook
                </code>
              </div>
              <div>
                <span className="text-sm font-medium">Session Creation (New Sessions Only):</span>
                <code className="bg-gray-100 p-2 rounded text-sm block">
                  https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7
                </code>
                <p className="text-xs text-gray-600 mt-1">
                  Triggers only when new sessions are created (including Group and RMR Live sessions)
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex gap-3">
            <button
              onClick={runTest}
              disabled={testing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Stripe Webhook'}
            </button>
            <button
              onClick={runSessionTest}
              disabled={sessionTesting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {sessionTesting ? 'Testing...' : 'Test Session Webhook'}
            </button>
          </div>

          {testResult && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Stripe Webhook Test Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          {sessionTestResult && (
            <div className="mb-6 p-4 bg-green-50 rounded">
              <h3 className="font-semibold mb-2">Session Webhook Test Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(sessionTestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Memberships</h2>
            <button
              onClick={fetchRecentMemberships}
              className="text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : memberships.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No memberships found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((membership) => (
                    <tr key={membership.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{membership.email}</td>
                      <td className="p-2">{formatDate(membership.date)}</td>
                      <td className="p-2">£{membership.amount.toFixed(2)}</td>
                      <td className="p-2">
                        {membership.created_at ? formatDate(membership.created_at) : 'N/A'}
                      </td>
                    </tr>
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
