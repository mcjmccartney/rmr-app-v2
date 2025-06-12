'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import MonthlyBreakdownModal from '@/components/MonthlyBreakdownModal';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface Finance {
  id: string;
  month: string;
  year: number;
  expected: number;
  created?: string;
}

export default function FinancesPage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFinances();
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

  // Helper function to determine UK tax year from month and year
  const getUKTaxYear = (month: string, year: number): string => {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthOrder.indexOf(month);

    // UK tax year runs from April 6th to April 5th
    // January-March belongs to previous tax year, April-December belongs to current tax year
    if (monthIndex >= 0 && monthIndex <= 2) { // Jan, Feb, Mar
      return `${year - 1}/${year.toString().slice(-2)}`;
    } else { // Apr-Dec
      return `${year}/${(year + 1).toString().slice(-2)}`;
    }
  };

  // Group finances by UK tax year, then by month
  const financesByTaxYear = filteredFinances.reduce((acc, finance) => {
    const taxYear = getUKTaxYear(finance.month, finance.year);
    const monthKey = `${finance.month} ${finance.year}`;

    if (!acc[taxYear]) {
      acc[taxYear] = {};
    }
    if (!acc[taxYear][monthKey]) {
      acc[taxYear][monthKey] = [];
    }
    acc[taxYear][monthKey].push(finance);
    return acc;
  }, {} as Record<string, Record<string, Finance[]>>);

  // Sort tax years (most recent first)
  const sortedTaxYears = Object.keys(financesByTaxYear).sort((a, b) => {
    const yearA = parseInt(a.split('/')[0]);
    const yearB = parseInt(b.split('/')[0]);
    return yearB - yearA;
  });

  // Helper function to sort months within a tax year chronologically
  const sortMonthsInTaxYear = (months: string[], taxYear: string): string[] => {
    const monthOrder = ['April', 'May', 'June', 'July', 'August', 'September',
                       'October', 'November', 'December', 'January', 'February', 'March'];

    return months.sort((a, b) => {
      const [monthA] = a.split(' ');
      const [monthB] = b.split(' ');
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });
  };

  const toggleMonth = (monthKey: string) => {
    const newExpandedMonths = new Set(expandedMonths);
    if (newExpandedMonths.has(monthKey)) {
      newExpandedMonths.delete(monthKey);
    } else {
      newExpandedMonths.add(monthKey);
    }
    setExpandedMonths(newExpandedMonths);
  };

  const toggleTaxYear = (taxYear: string) => {
    const newExpandedMonths = new Set(expandedMonths);
    if (newExpandedMonths.has(taxYear)) {
      newExpandedMonths.delete(taxYear);
    } else {
      newExpandedMonths.add(taxYear);
    }
    setExpandedMonths(newExpandedMonths);
  };

  const calculateMonthlyTotal = (finances: Finance[]) => {
    return finances.reduce((total, finance) => total + (finance.expected || 0), 0);
  };

  const calculateTaxYearTotal = (monthsData: Record<string, Finance[]>) => {
    return Object.values(monthsData).flat().reduce((total, finance) => total + (finance.expected || 0), 0);
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
        {/* Tax Year Accordions */}
        <div className="space-y-3 mt-4">
          {sortedTaxYears.map((taxYear) => {
            const taxYearData = financesByTaxYear[taxYear];
            const taxYearTotal = calculateTaxYearTotal(taxYearData);
            const isTaxYearExpanded = expandedMonths.has(taxYear);
            const sortedMonthsInTaxYear = sortMonthsInTaxYear(Object.keys(taxYearData), taxYear);

            return (
              <div key={taxYear} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Tax Year Header */}
                <button
                  onClick={() => toggleTaxYear(taxYear)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {taxYear} - £{taxYearTotal.toLocaleString()}
                  </h2>
                  {isTaxYearExpanded ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </button>

                {/* Monthly Accordions within Tax Year */}
                {isTaxYearExpanded && (
                  <div className="border-t border-gray-100">
                    {sortedMonthsInTaxYear.map((monthKey) => {
                      const monthFinances = taxYearData[monthKey];
                      const monthlyTotal = calculateMonthlyTotal(monthFinances);
                      const isMonthExpanded = expandedMonths.has(`${taxYear}-${monthKey}`);

                      return (
                        <div key={`${taxYear}-${monthKey}`} className="border-b border-gray-100 last:border-b-0">
                          {/* Month Header */}
                          <button
                            onClick={() => handleFinanceClick(monthFinances[0])} // Open sidepane for month breakdown
                            className="w-full p-3 pl-8 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                          >
                            <div>
                              <h3 className="font-medium text-gray-900">{monthKey}</h3>
                              <p className="text-sm text-gray-500">
                                £{monthlyTotal.toLocaleString()} | {monthFinances.length} Entries
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                          </button>
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

      {/* Monthly Breakdown Modal */}
      {isModalOpen && selectedFinance && (
        <MonthlyBreakdownModal
          finance={selectedFinance}
          onClose={closeModal}
          onUpdate={fetchFinances}
        />
      )}
    </div>
  );
}
