'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useApp } from '@/context/AppContext';
import { CreditCard } from 'lucide-react';
import { Membership } from '@/types';

export default function MembershipsPage() {
  const { state, loadMemberships } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadMemberships();
      } catch (error) {
        console.error('Error loading memberships:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadMemberships]);

  const groupedMemberships = state.memberships.reduce((acc, membership) => {
    const month = membership.month;
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(membership);
    return acc;
  }, {} as Record<string, Membership[]>);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-amber-800">
        <Header title="Memberships" />
      </div>

      <div className="px-4 py-8 bg-gray-50 min-h-screen">
        {isLoading ? (
          <div className="text-center mt-8">
            <div className="text-gray-500">Loading memberships...</div>
          </div>
        ) : state.memberships.length === 0 ? (
          <div className="text-center mt-4">
            <CreditCard size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Memberships Yet</h2>
            <p className="text-gray-500">
              Membership payments will appear here when added to your Supabase database.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMemberships)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, memberships]) => (
                <div key={month} className="bg-white rounded-lg shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{month}</h3>
                    <p className="text-sm text-gray-500">{memberships.length} payment(s)</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {memberships.map((membership) => (
                      <div key={membership.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {membership.email}
                            </div>
                            <div className={`text-sm ${
                              membership.status === 'Paid' ? 'text-green-600' :
                              membership.status === 'Pending' ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {membership.status}
                            </div>
                            {membership.paymentDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Paid: {new Date(membership.paymentDate).toLocaleDateString('en-GB')}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              £{membership.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
