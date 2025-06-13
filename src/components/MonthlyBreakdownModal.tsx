'use client';

import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import SlideUpModal from './modals/SlideUpModal';
import { useModalEnterKeyHandler } from '@/hooks/useEnterKeyHandler';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Finance {
  id: string;
  month: string;
  year: number;
  expected: number;
  created?: string;
}



interface BreakdownData {
  sessionTypes: Record<string, { count: number; total: number }>;
  memberships: { count: number; total: number };
  totalActual: number;
}

interface MonthlyBreakdownModalProps {
  finance: Finance | null;
  allFinancesForMonth?: Finance[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MonthlyBreakdownModal({ finance, allFinancesForMonth, isOpen, onClose, onUpdate }: MonthlyBreakdownModalProps) {
  const [isEditingExpected, setIsEditingExpected] = useState(false);
  const [localExpectedTotal, setLocalExpectedTotal] = useState(0);

  // Calculate total expected from all finance entries for this month
  const totalExpected = localExpectedTotal || allFinancesForMonth?.reduce((sum, f) => sum + (f.expected || 0), 0) || finance?.expected || 0;
  const [expectedAmount, setExpectedAmount] = useState('0');

  // Update expectedAmount when totalExpected changes
  useEffect(() => {
    const currentTotal = allFinancesForMonth?.reduce((sum, f) => sum + (f.expected || 0), 0) || finance?.expected || 0;
    setLocalExpectedTotal(currentTotal);
    setExpectedAmount(currentTotal.toString());
  }, [allFinancesForMonth, finance?.expected]);
  const [breakdownData, setBreakdownData] = useState<BreakdownData>({
    sessionTypes: {},
    memberships: { count: 0, total: 0 },
    totalActual: 0
  });
  const [loading, setLoading] = useState(true);

  // Add Enter key support for Save button when editing
  useModalEnterKeyHandler(
    handleExpectedUpdate,
    isEditingExpected && isOpen,
    [isEditingExpected, isOpen]
  );

  useEffect(() => {
    if (finance) {
      fetchBreakdownData();
    }
  }, [finance?.month, finance?.year]);

  const fetchBreakdownData = async () => {
    if (!finance) return;

    try {
      setLoading(true);

      // Get sessions for this month/year
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('session_type, quote, booking_date')
        .gte('booking_date', `${finance.year}-${getMonthNumber(finance.month).toString().padStart(2, '0')}-01`)
        .lt('booking_date', getNextMonthDate(finance.month, finance.year));

      if (sessionsError) throw sessionsError;

      console.log(`Fetching data for ${finance.month} ${finance.year}:`, {
        sessions: sessions?.length || 0,
        sessionsSample: sessions?.slice(0, 2)
      });

      // Get memberships for this month/year
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('amount, date')
        .gte('date', `${finance.year}-${getMonthNumber(finance.month).toString().padStart(2, '0')}-01`)
        .lt('date', getNextMonthDate(finance.month, finance.year));

      if (membershipsError) throw membershipsError;

      console.log(`Memberships for ${finance.month} ${finance.year}:`, {
        memberships: memberships?.length || 0,
        membershipsSample: memberships?.slice(0, 2)
      });

      // Process session data
      const sessionTypes: Record<string, { count: number; total: number }> = {};
      (sessions || []).forEach((session: any) => {
        const type = session.session_type || 'Unknown';
        if (!sessionTypes[type]) {
          sessionTypes[type] = { count: 0, total: 0 };
        }
        sessionTypes[type].count += 1;
        sessionTypes[type].total += session.quote || 0;
      });

      // Process membership data
      const membershipTotal = (memberships || []).reduce((sum: number, membership: any) => sum + (membership.amount || 0), 0);
      const membershipCount = (memberships || []).length;

      const totalActual = Object.values(sessionTypes).reduce((sum, type) => sum + type.total, 0) + membershipTotal;

      setBreakdownData({
        sessionTypes,
        memberships: { count: membershipCount, total: membershipTotal },
        totalActual
      });

    } catch (error) {
      console.error('Error fetching breakdown data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthNumber = (monthName: string): number => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(monthName) + 1;
  };

  const getNextMonthDate = (monthName: string, year: number): string => {
    const monthNum = getMonthNumber(monthName);
    if (monthNum === 12) {
      return `${year + 1}-01-01`;
    } else {
      return `${year}-${(monthNum + 1).toString().padStart(2, '0')}-01`;
    }
  };

  const handleExpectedUpdate = async () => {
    if (!finance || !allFinancesForMonth) {
      console.error('Missing required data');
      return;
    }

    try {
      const newExpectedAmount = parseFloat(expectedAmount);

      if (isNaN(newExpectedAmount) || newExpectedAmount < 0) {
        alert('Please enter a valid positive number');
        return;
      }

      console.log(`Updating expected amount for ${finance.month} ${finance.year} to £${newExpectedAmount}`);

      // First, let's test if we can read the records we're trying to update
      console.log('Testing read access to records...');
      for (const entry of allFinancesForMonth) {
        const { data: testRead, error: readError } = await supabase
          .from('finances')
          .select('*')
          .eq('id', entry.id)
          .single();

        if (readError) {
          console.error(`Cannot read record ${entry.id}:`, readError);
          throw new Error(`Cannot read record: ${readError.message}`);
        }
        console.log(`Record ${entry.id} current data:`, testRead);
      }

      // Strategy: Put the entire expected amount in the first entry, set others to 0
      // This ensures the main page calculation (sum of all entries) shows the correct total

      const updatePromises = allFinancesForMonth.map((financeEntry, index) => {
        const amount = index === 0 ? newExpectedAmount : 0;
        console.log(`Preparing update for entry ${index + 1}:`, {
          id: financeEntry.id,
          amount: amount,
          updatePayload: { expected: Number(amount.toFixed(2)) }
        });
        return supabase
          .from('finances')
          .update({ expected: Number(amount.toFixed(2)) })
          .eq('id', financeEntry.id);
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.error('Detailed update errors:', errors.map(e => ({
          error: e.error,
          message: e.error?.message,
          details: e.error?.details,
          hint: e.error?.hint,
          code: e.error?.code
        })));
        throw new Error(`Failed to update expected amount: ${errors[0].error?.message || 'Unknown error'}`);
      }

      console.log(`Successfully updated ${allFinancesForMonth.length} finance entries`);

      // Update the local state immediately to reflect the change
      setLocalExpectedTotal(newExpectedAmount);

      // Also update the input field to show the new value
      setExpectedAmount(newExpectedAmount.toString());

      setIsEditingExpected(false);
      onUpdate(); // Refresh the parent data

    } catch (error) {
      console.error('Error updating expected amount:', error);
      alert('Failed to save expected amount. Please try again.');
    }
  };

  const difference = breakdownData.totalActual - totalExpected;
  const differenceColor = difference >= 0 ? 'text-green-600' : 'text-red-600';

  // Create pie chart data
  const chartData = [
    ...Object.entries(breakdownData.sessionTypes).map(([type, data]) => ({
      label: type,
      value: data.total,
      count: data.count,
      color: getSessionTypeColor(type)
    })),
    ...(breakdownData.memberships.total > 0 ? [{
      label: 'Memberships',
      value: breakdownData.memberships.total,
      count: breakdownData.memberships.count,
      color: '#0a91b1'
    }] : [])
  ];

  function getSessionTypeColor(sessionType: string): string {
    const colors: Record<string, string> = {
      'In-Person': '#973b00',      // Amber-brown
      'Online': '#4f6749',         // Green
      'Group': '#b5aa9f',          // Beige
      'RMR Live': '#e17100',       // Orange
      'Coaching': '#2b4f6c',       // Dark blue
      'Training': '#7aa37a',       // Light green
      'Memberships': '#0a91b1',    // Blue
      'Unknown': '#ecebdd'         // Light beige
    };
    return colors[sessionType] || '#ecebdd';
  }

  if (!finance) return null;

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${finance.month} ${finance.year} Breakdown`}
    >
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading breakdown...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Expected Amount Section */}
          <div>
              {isEditingExpected ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Amount</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={expectedAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        console.log('Input changed:', value);
                        setExpectedAmount(value);
                      }}
                      className="w-full text-lg font-semibold text-center border border-gray-300 rounded-lg p-3 pl-8 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="0"
                      autoFocus
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-gray-500">
                      £
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setIsEditingExpected(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExpectedUpdate}
                      className="flex-1 px-4 py-2 bg-[#973b00] text-white rounded-lg hover:bg-[#7d3100]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-3 -m-3"
                  onClick={() => setIsEditingExpected(true)}
                >
                  <h3 className="text-lg font-semibold mb-2">
                    Actual: £{breakdownData.totalActual.toLocaleString()}
                  </h3>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">
                      Expected: £{totalExpected.toLocaleString()}
                    </span>
                    <span className={`font-medium ${differenceColor}`}>
                      {difference >= 0 ? '+' : ''}£{difference.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#973b00] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((breakdownData.totalActual / (totalExpected || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

          {/* Breakdown Chart and Legend */}
          {chartData.length > 0 && (
            <>
              <h4 className="font-medium text-gray-900 mb-4">Income Breakdown</h4>

              {/* Chart.js Donut Chart */}
              <div className="w-full h-64 mb-6">
                <Doughnut
                  data={{
                    labels: chartData.map(item => item.label),
                    datasets: [{
                      data: chartData.map(item => item.value),
                      backgroundColor: chartData.map(item => item.color),
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                          label: function(context: any) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            const item = chartData[context.dataIndex];
                            return [
                              `${label}: £${value.toLocaleString()}`,
                              `${item.count} entries (${percentage}%)`
                            ];
                          }
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {chartData.map((item, index) => {
                  const percentage = ((item.value / breakdownData.totalActual) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.count} entries • {percentage}%</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        £{item.value.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {chartData.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">
                No income data found for this month
              </div>
            </div>
          )}
        </div>
      )}
    </SlideUpModal>
  );
}
