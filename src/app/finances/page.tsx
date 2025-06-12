'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import FinanceModal from '@/components/FinanceModal';
import { formatFullMonthYear } from '@/utils/dateFormatting';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface Finance {
  id: string;
  month: string;
  year: number;
  expected: number;
  created?: string;
}

interface FinanceBreakdown {
  id: string;
  month: string;
  year: number;
  category: string;
  amount: number;
  color: string;
}

export default function FinancesPage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [breakdowns, setBreakdowns] = useState<FinanceBreakdown[]>([]);
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFinances();
    fetchBreakdowns();
  }, []);

  const fetchFinances = async () => {
    try {
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('year', { ascending: false })
        .order('month');

      if (error) throw error;
      setFinances(data || []);
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBreakdowns = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_breakdown')
        .select('*')
        .order('year', { ascending: false })
        .order('month');

      if (error) throw error;
      setBreakdowns(data || []);
    } catch (error) {
      console.error('Error fetching finance breakdowns:', error);
    }
  };

  // Filter finances based on search query
  const filteredFinances = finances.filter(finance => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      finance.month.toLowerCase().includes(searchTerm) ||
      finance.year.toString().includes(searchTerm)
    );
  });

  const handleFinanceClick = (finance: Finance) => {
    setSelectedFinance(finance);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFinance(null);
  };

  const handleAddFinance = () => {
    // TODO: Implement add finance functionality
    console.log('Add finance clicked');
  };

  // Group finances by month/year for accordion display
  const financesByMonth = filteredFinances.reduce((acc, finance) => {
    const monthKey = `${finance.month} ${finance.year}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(finance);
    return acc;
  }, {} as Record<string, Finance[]>);

  // Sort months chronologically (most recent first)
  const sortedMonths = Object.keys(financesByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');

    if (yearA !== yearB) {
      return Number(yearB) - Number(yearA);
    }

    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
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

  const calculateMonthlyTotal = (finances: Finance[]) => {
    return finances.reduce((total, finance) => total + (finance.expected || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading finances...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-amber-800">
        <Header
          title="Finances"
          buttons={[
            {
              icon: Plus,
              onClick: handleAddFinance,
              title: 'Add Finance Entry'
            }
          ]}
          showSearch
          onSearch={setSearchQuery}
          searchPlaceholder="Search"
        />
      </div>

      <div className="px-4 pb-4 bg-gray-50 flex-1">
        {/* Monthly Accordions */}
        <div className="space-y-3 mt-4">
          {sortedMonths.map((monthKey) => {
            const monthFinances = financesByMonth[monthKey];
            const monthlyTotal = calculateMonthlyTotal(monthFinances);
            const isExpanded = expandedMonths.has(monthKey);

            return (
              <div key={monthKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Month Header */}
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {monthKey} - £{monthlyTotal.toLocaleString()} | {monthFinances.length} Entries
                  </h2>
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </button>

                {/* Finance List */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {monthFinances.map((finance) => {
                      return (
                        <div
                          key={finance.id}
                          onClick={() => handleFinanceClick(finance)}
                          className="p-4 border-b border-gray-100 last:border-b-0 active:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {finance.month} {finance.year}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Expected: £{finance.expected?.toLocaleString() || '0'}
                              {finance.created && ` · ${new Date(finance.created).toLocaleDateString('en-GB')}`}
                            </p>
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
      </div>

      {/* Finance Modal */}
      {isModalOpen && selectedFinance && (
        <FinanceModal
          finance={selectedFinance}
          breakdowns={breakdowns.filter(
            b => b.month === selectedFinance.month && b.year === selectedFinance.year
          )}
          onClose={closeModal}
          onUpdate={fetchFinances}
        />
      )}
    </div>
  );
}
