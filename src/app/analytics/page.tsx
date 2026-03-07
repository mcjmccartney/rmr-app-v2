'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Suspense } from 'react';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function AnalyticsContent() {
  const { state } = useApp();
  const { clients, sessions, memberships } = state;

  // --- Total paid per client ---
  const clientPayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const session of sessions) {
      if (session.sessionPaid && session.clientId) {
        totals[session.clientId] = (totals[session.clientId] || 0) + (session.quote || 0);
      }
    }
    return Object.entries(totals)
      .map(([clientId, total]) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return null;
        const name = client.partnerName
          ? `${client.firstName} & ${client.partnerName}`
          : `${client.firstName} ${client.lastName}`;
        return { name, total };
      })
      .filter((x): x is { name: string; total: number } => x !== null)
      .sort((a, b) => b.total - a.total);
  }, [sessions, clients]);

  // --- Average sessions per client ---
  const avgSessions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const session of sessions) {
      if (session.clientId) {
        counts[session.clientId] = (counts[session.clientId] || 0) + 1;
      }
    }
    const values = Object.values(counts);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [sessions]);

  // --- Average membership months ---
  const avgMembershipMonths = useMemo(() => {
    const memberEmails = new Set(
      clients.filter(c => c.membership && c.email).map(c => c.email!)
    );
    const counts: Record<string, number> = {};
    for (const m of memberships) {
      if (memberEmails.has(m.email)) {
        counts[m.email] = (counts[m.email] || 0) + 1;
      }
    }
    const values = Object.values(counts);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [memberships, clients]);

  // --- Membership churn rate ---
  const avgChurnRate = useMemo(() => {
    // Group membership payments by YYYY-MM
    const byMonth: Record<string, Set<string>> = {};
    for (const m of memberships) {
      const month = m.date.slice(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = new Set();
      byMonth[month].add(m.email);
    }
    const sortedMonths = Object.keys(byMonth).sort();
    if (sortedMonths.length < 2) return 0;

    const churnRates: number[] = [];
    for (let i = 0; i < sortedMonths.length - 1; i++) {
      const current = byMonth[sortedMonths[i]];
      const next = byMonth[sortedMonths[i + 1]];
      const lost = [...current].filter(email => !next.has(email)).length;
      if (current.size > 0) {
        churnRates.push((lost / current.size) * 100);
      }
    }
    if (churnRates.length === 0) return 0;
    return churnRates.reduce((a, b) => a + b, 0) / churnRates.length;
  }, [memberships]);

  const barData = {
    labels: clientPayTotals.map(c => c.name),
    datasets: [
      {
        label: 'Total Paid (£)',
        data: clientPayTotals.map(c => c.total),
        backgroundColor: '#92400e',
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => `£${ctx.parsed.x.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: any) => `£${value.toLocaleString()}`,
          color: '#6b7280',
        },
        grid: { color: '#f3f4f6' },
      },
      y: {
        ticks: { color: '#374151', font: { size: 12 } },
        grid: { display: false },
      },
    },
  };

  const chartHeight = Math.max(300, clientPayTotals.length * 36);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-amber-800">
        <Header title="Analytics" />
      </div>

      <div className="px-4 pb-8 bg-gray-50 flex-1">
        {/* Headline cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Avg Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{avgSessions.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-1">per client</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Avg Membership</p>
            <p className="text-2xl font-bold text-gray-900">{avgMembershipMonths.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-1">months paid</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Churn Rate</p>
            <p className="text-2xl font-bold text-gray-900">{avgChurnRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">avg per month</p>
          </div>
        </div>

        {/* Total pay bar chart */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Total Paid by Client</p>
          {clientPayTotals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No paid sessions found</p>
          ) : (
            <div style={{ height: chartHeight }}>
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AnalyticsContent />
    </Suspense>
  );
}
