'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import MonthlyBreakdownModal from '@/components/MonthlyBreakdownModal';
import { ChevronDown, ChevronRight, Calendar, Star, PoundSterling, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface Finance {
  id: string;
  month: string;
  year: number;
  expected: number;
  created?: string;
}

export default function FinancesPage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null);
  const [selectedMonthFinances, setSelectedMonthFinances] = useState<Finance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      console.log('Fetching finances data...');
      console.log('Supabase client:', supabase);

      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('finances')
        .select('count', { count: 'exact', head: true });

      console.log('Connection test result:', { testData, testError });

      // Fetch finances
      const { data: financesData, error: financesError } = await supabase
        .from('finances')
        .select('id, month, year, expected, created_at')
        .order('year', { ascending: false })
        .order('month');

      if (financesError) {
        console.error('Finances error details:', {
          message: financesError.message,
          details: financesError.details,
          hint: financesError.hint,
          code: financesError.code
        });
        // Don't throw error, just log it and continue with empty data
        console.warn('Continuing with empty finances data due to error');
      }

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('session_type, booking_date, quote')
        .order('booking_date', { ascending: false });

      if (sessionsError) {
        console.error('Sessions error:', sessionsError);
        // Don't throw error for sessions, just log it
      }

      // Fetch memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .order('date', { ascending: false });

      if (membershipsError) {
        console.error('Memberships error:', membershipsError);
        // Don't throw error for memberships, just log it
      }

      console.log('Raw finances data from Supabase:', financesData);
      console.log('Number of finance entries:', financesData?.length || 0);

      // Map database fields to interface fields
      const mappedFinances = (financesData || []).map(finance => ({
        ...finance,
        expected: finance.expected || 0,
        actual: 0 // We'll calculate this from sessions/memberships
      }));

      console.log('Mapped finances data:', mappedFinances);
      setFinances(mappedFinances);
      setSessions(sessionsData || []);
      setMemberships(membershipsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleFinanceClick = (finance: Finance, allMonthFinances: Finance[]) => {
    setSelectedFinance(finance);
    setSelectedMonthFinances(allMonthFinances);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFinance(null);
    setSelectedMonthFinances([]);
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

  // Helper function to sort months within a tax year (most recent first)
  const sortMonthsInTaxYear = (months: string[]): string[] => {
    const monthOrder = ['April', 'May', 'June', 'July', 'August', 'September',
                       'October', 'November', 'December', 'January', 'February', 'March'];

    return months.sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');

      // First sort by year (most recent first)
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }

      // Then sort by month within the same year (most recent first)
      return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
    });
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

  // Helper function to get month number from name
  const getMonthNumber = (monthName: string): number => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(monthName) + 1;
  };

  // Calculate actual income for a specific month/year from sessions and memberships
  const calculateActualIncome = (month: string, year: number) => {
    const monthNum = getMonthNumber(month);

    // Get sessions for this month/year
    const monthSessions = sessions.filter(session => {
      // Use booking_date column from your sessions table
      const dateField = session.booking_date;
      if (!dateField) return false;

      const sessionDate = new Date(dateField);
      const sessionMonth = sessionDate.getMonth() + 1;
      const sessionYear = sessionDate.getFullYear();
      const matches = sessionMonth === monthNum && sessionYear === year;



      return matches;
    });

    // Get memberships for this month/year
    const monthMemberships = memberships.filter(membership => {
      const membershipDate = new Date(membership.date);
      const membershipMonth = membershipDate.getMonth() + 1;
      const membershipYear = membershipDate.getFullYear();
      const matches = membershipMonth === monthNum && membershipYear === year;



      return matches;
    });

    // Calculate session total using quote column
    const sessionTotal = monthSessions.reduce((sum, session) => {
      const amount = session.quote || 0;
      return sum + amount;
    }, 0);

    const membershipTotal = monthMemberships.reduce((sum, membership) => {
      const amount = membership.amount || membership.price || 0;
      return sum + amount;
    }, 0);



    return sessionTotal + membershipTotal;
  };

  // Calculate Sessions and Membership totals separately for a month
  const calculateMonthlyBreakdown = (month: string, year: number) => {
    const monthNum = getMonthNumber(month);

    // Get sessions for this month/year
    const monthSessions = sessions.filter(session => {
      const dateField = session.booking_date;
      if (!dateField) return false;
      const sessionDate = new Date(dateField);
      const sessionMonth = sessionDate.getMonth() + 1;
      const sessionYear = sessionDate.getFullYear();
      return sessionMonth === monthNum && sessionYear === year;
    });

    // Get memberships for this month/year
    const monthMemberships = memberships.filter(membership => {
      const membershipDate = new Date(membership.date);
      const membershipMonth = membershipDate.getMonth() + 1;
      const membershipYear = membershipDate.getFullYear();
      return membershipMonth === monthNum && membershipYear === year;
    });

    const sessionsTotal = monthSessions.reduce((sum, session) => sum + (session.quote || 0), 0);
    const membershipsTotal = monthMemberships.reduce((sum, membership) => sum + (membership.amount || membership.price || 0), 0);

    return {
      sessions: sessionsTotal,
      memberships: membershipsTotal,
      total: sessionsTotal + membershipsTotal
    };
  };

  const calculateMonthlyTotal = (finances: Finance[], month: string, year: number) => {
    const expectedTotal = finances.reduce((total, finance) => total + (finance.expected || 0), 0);
    const actualTotal = calculateActualIncome(month, year);
    return { expected: expectedTotal, actual: actualTotal };
  };

  const calculateTaxYearTotal = (monthsData: Record<string, Finance[]>) => {
    let expectedTotal = 0;
    let actualTotal = 0;

    Object.entries(monthsData).forEach(([monthKey, finances]) => {
      const [month, yearStr] = monthKey.split(' ');
      const year = parseInt(yearStr);

      expectedTotal += finances.reduce((sum, finance) => sum + (finance.expected || 0), 0);
      actualTotal += calculateActualIncome(month, year);
    });

    return { expected: expectedTotal, actual: actualTotal };
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
          showSearch
          onSearch={setSearchQuery}
          searchPlaceholder="Search"
        />
      </div>

      <div className="px-4 pb-4 bg-gray-50 flex-1">
        {/* Tax Year Accordions */}
        <div className="space-y-3 mt-4">
          {sortedTaxYears.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No finance entries found</p>
              <p className="text-sm text-gray-400">Add some entries to your finances table in Supabase to get started</p>
            </div>
          ) : (
            sortedTaxYears.map((taxYear) => {
            const taxYearData = financesByTaxYear[taxYear];
            const taxYearTotals = calculateTaxYearTotal(taxYearData);
            const isTaxYearExpanded = expandedMonths.has(taxYear);
            const sortedMonthsInTaxYear = sortMonthsInTaxYear(Object.keys(taxYearData));

            return (
              <div key={taxYear} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Tax Year Header */}
                <button
                  onClick={() => toggleTaxYear(taxYear)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {taxYear} - £{taxYearTotals.actual.toLocaleString()}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Expected: £{taxYearTotals.expected.toLocaleString()}
                    </p>
                  </div>
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
                      const [month, yearStr] = monthKey.split(' ');
                      const year = parseInt(yearStr);
                      const monthlyTotals = calculateMonthlyTotal(monthFinances, month, year);
                      const monthlyBreakdown = calculateMonthlyBreakdown(month, year);

                      return (
                        <div key={`${taxYear}-${monthKey}`} className="border-b border-gray-100 last:border-b-0">
                          {/* Month Header - Table Format */}
                          <button
                            onClick={() => handleFinanceClick(monthFinances[0], monthFinances)} // Open sidepane for month breakdown
                            className="w-full p-3 pl-8 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="flex items-center">
                              {/* Month name with equal spacing on mobile */}
                              <h3 className="font-medium text-gray-900 w-12 md:min-w-[60px] flex-shrink-0">
                                {month.substring(0, 3)}
                              </h3>

                              {/* Table-style data with equal spacing */}
                              <div className="flex items-center flex-1 justify-between px-2 md:px-4">
                                {/* Sessions - Always visible */}
                                <div className="flex flex-col items-center flex-1">
                                  <Calendar size={16} className="text-gray-400 mb-1" />
                                  <span className="text-sm font-medium text-gray-900">£{monthlyBreakdown.sessions.toLocaleString()}</span>
                                </div>

                                {/* Membership - Hidden on mobile */}
                                <div className="hidden md:flex flex-col items-center flex-1">
                                  <Star size={16} className="text-gray-400 mb-1" />
                                  <span className="text-sm font-medium text-gray-900">£{monthlyBreakdown.memberships.toLocaleString()}</span>
                                </div>

                                {/* Expected - Always visible */}
                                <div className="flex flex-col items-center flex-1">
                                  <Target size={16} className="text-gray-400 mb-1" />
                                  <span className="text-sm font-medium text-gray-900">£{monthlyTotals.expected.toLocaleString()}</span>
                                </div>

                                {/* Actual - Always visible */}
                                <div className="flex flex-col items-center flex-1">
                                  <PoundSterling size={16} className="text-gray-400 mb-1" />
                                  <span className="text-sm font-medium text-gray-900">£{monthlyTotals.actual.toLocaleString()}</span>
                                </div>

                                {/* Variance - Always visible */}
                                <div className="flex flex-col items-center flex-1">
                                  <div className="w-4 h-4 mb-1 flex items-center justify-center">
                                    {monthlyTotals.actual >= monthlyTotals.expected ? (
                                      <TrendingUp size={16} className="text-green-600" />
                                    ) : (
                                      <TrendingDown size={16} className="text-red-600" />
                                    )}
                                  </div>
                                  <span className={`text-sm font-medium ${
                                    monthlyTotals.actual >= monthlyTotals.expected
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}>
                                    {monthlyTotals.actual >= monthlyTotals.expected ? '+' : ''}£{(monthlyTotals.actual - monthlyTotals.expected).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Monthly Breakdown Modal */}
      <MonthlyBreakdownModal
        finance={selectedFinance}
        allFinancesForMonth={selectedMonthFinances}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpdate={fetchAllData}
      />
    </div>
  );
}
