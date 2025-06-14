'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import { Membership } from '@/types';
import { ChevronDown, ChevronRight, CreditCard } from 'lucide-react';

export default function MembershipsPage() {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const filteredMemberships = state.memberships.filter(membership => {
    const searchTerm = searchQuery.toLowerCase();
    return membership.email.toLowerCase().includes(searchTerm);
  });

  // Group memberships by month/year from date
  const membershipsByMonth = filteredMemberships.reduce((acc, membership) => {
    const date = new Date(membership.date);
    const monthKey = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(membership);
    return acc;
  }, {} as Record<string, Membership[]>);

  // Sort months in descending order (newest first)
  const sortedMonths = Object.keys(membershipsByMonth).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  const toggleMonth = (monthKey: string) => {
    const newExpandedMonths = new Set(expandedMonths);
    if (newExpandedMonths.has(monthKey)) {
      newExpandedMonths.delete(monthKey);
    } else {
      newExpandedMonths.add(monthKey);
    }
    setExpandedMonths(newExpandedMonths);
  };

  const calculateMonthlyRevenue = (memberships: Membership[]) => {
    return memberships.reduce((total, membership) => total + membership.amount, 0);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-amber-800">
        <Header
          title="Memberships"
          showSearch
          onSearch={setSearchQuery}
          searchPlaceholder="Search by email"
        />
      </div>

      <div className="px-4 pb-4 bg-gray-50 flex-1">
        {state.memberships.length === 0 ? (
          <div className="text-center mt-8">
            <CreditCard size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Memberships Yet</h2>
            <p className="text-gray-500">
              Membership payments will appear here when added to your Supabase database.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {sortedMonths.map((monthKey) => {
              const monthMemberships = membershipsByMonth[monthKey];
              const monthlyRevenue = calculateMonthlyRevenue(monthMemberships);
              const isExpanded = expandedMonths.has(monthKey);

              return (
                <div key={monthKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Month Header */}
                  <button
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {monthKey} - £{monthlyRevenue.toFixed(2)}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {monthMemberships.length} Payments
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                  </button>

                  {/* Memberships List */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {monthMemberships.map((membership) => {
                        // Find client by email
                        const client = state.clients.find(c => c.email === membership.email);
                        const displayName = client
                          ? `${client.firstName} ${client.lastName}${client.dogName ? ` w/ ${client.dogName}` : ''}`
                          : membership.email;

                        return (
                          <div
                            key={membership.id}
                            className="p-4 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">{displayName}</h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(membership.date).toLocaleDateString('en-GB')}
                                </p>
                                {client && client.email !== displayName && (
                                  <p className="text-xs text-gray-400">{membership.email}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">
                                  £{membership.amount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
