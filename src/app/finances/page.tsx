'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import FinanceModal from '@/components/FinanceModal';

interface Finance {
  id: string;
  month: string;
  year: number;
  expected_amount: number;
  actual_amount: number;
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

  const handleFinanceClick = (finance: Finance) => {
    setSelectedFinance(finance);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFinance(null);
  };

  // Group finances by year
  const financesByYear = finances.reduce((acc, finance) => {
    const year = finance.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(finance);
    return acc;
  }, {} as Record<number, Finance[]>);

  // Calculate totals
  const totalActual = finances.reduce((sum, f) => sum + f.actual_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#4f6749] flex items-center justify-center">
        <div className="text-white text-lg">Loading finances...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#4f6749]">
      {/* Header */}
      <div className="bg-[#4f6749] text-white p-4">
        <h1 className="text-xl font-semibold">
          Finances Total - £{totalActual.toLocaleString()}
        </h1>
      </div>

      {/* Content */}
      <div className="bg-white min-h-screen">
        {Object.entries(financesByYear)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, yearFinances]) => {
            const yearTotal = yearFinances.reduce((sum, f) => sum + f.actual_amount, 0);
            
            return (
              <div key={year} className="mb-6">
                {/* Year Header */}
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {year}/{Number(year) + 1} - £{yearTotal.toLocaleString()}
                  </h2>
                </div>

                {/* Table Headers */}
                <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-100 text-sm font-medium text-gray-600 uppercase tracking-wider">
                  <div>MONTH</div>
                  <div>EXPECTED</div>
                  <div>ACTUAL</div>
                  <div>DIFFERENCE</div>
                </div>

                {/* Finance Rows */}
                {yearFinances.map((finance) => {
                  const difference = finance.actual_amount - finance.expected_amount;
                  const differenceColor = difference >= 0 ? 'text-green-600' : 'text-red-600';
                  
                  return (
                    <div
                      key={finance.id}
                      className="grid grid-cols-4 gap-4 px-4 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleFinanceClick(finance)}
                    >
                      <div className="font-medium text-gray-900">{finance.month}</div>
                      <div className="text-gray-700">£{finance.expected_amount.toLocaleString()}</div>
                      <div className="text-gray-700">£{finance.actual_amount.toLocaleString()}</div>
                      <div className={`font-medium ${differenceColor}`}>
                        £{difference >= 0 ? '+' : ''}{difference.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
