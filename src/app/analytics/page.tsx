'use client';

import { useMemo, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import ClientModal from '@/components/modals/ClientModal';
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

function categorizeReferral(answer: string): string {
  const s = answer.toLowerCase().trim();
  if (!s) return 'Other';

  if (s.includes('facebook') || /\bfb\b/.test(s)) return 'Facebook';
  if (s.includes('instagram') || /\big\b/.test(s)) return 'Instagram';
  if (s.includes('google') || s.includes('search engine') || s.includes('online search')) return 'Google';
  if (s.includes('youtube')) return 'YouTube';
  if (s.includes('vet') || s.includes('veterinar')) return 'Vet Referral';
  if (s.includes('flyer') || s.includes('leaflet') || s.includes('poster') || s.includes('sign')) return 'Flyer / Print';
  if (s.includes('website') || s.includes('web site') || s.includes('internet')) return 'Website';
  if (
    s.includes('recommend') || s.includes('referr') ||
    s.includes('word of mouth') || s.includes('wom') ||
    s.includes('friend') || s.includes('family') ||
    s.includes('colleague') || s.includes('told') ||
    s.includes('suggested') || s.includes('via ')
  ) return 'Recommended';

  // Short answers not matching known patterns are likely a person's name (word of mouth)
  const wordCount = s.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 4) return 'Recommended';

  return 'Other';
}

function makeBarOptions(prefix: string) {
  return {
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
          label: (ctx: any) => `${prefix}${ctx.parsed.x.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: any) => `${prefix}${value.toLocaleString()}`,
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
}

function AnalyticsContent() {
  const { state } = useApp();
  const { clients, sessions, memberships, behaviourQuestionnaires, clientEmailAliases } = state;
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const payChartRef = useRef<any>(null);

  // --- Grand total per client (all session quotes + memberships, matching client profile) ---
  const clientPayTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    // All session quotes (matches client profile Sessions Total)
    for (const session of sessions) {
      if (session.clientId) {
        totals[session.clientId] = (totals[session.clientId] || 0) + (session.quote || 0);
      }
    }

    // Build email → clientId map (primary email + aliases)
    const emailToClientId = new Map<string, string>();
    for (const client of clients) {
      if (client.email) emailToClientId.set(client.email.toLowerCase(), client.id);
      for (const alias of (clientEmailAliases[client.id] || [])) {
        emailToClientId.set(alias.email.toLowerCase(), client.id);
      }
    }

    // Membership payments
    for (const m of memberships) {
      const clientId = emailToClientId.get(m.email.toLowerCase());
      if (clientId) {
        totals[clientId] = (totals[clientId] || 0) + (m.amount || 0);
      }
    }

    return Object.entries(totals)
      .map(([clientId, total]) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return null;
        const name = client.partnerName
          ? `${client.firstName} & ${client.partnerName}`
          : `${client.firstName} ${client.lastName}`;
        if (name === 'Soothing Moon Therapies') return null;
        return { name, total, clientId, client };
      })
      .filter((x): x is { name: string; total: number; clientId: string; client: typeof clients[0] } => x !== null)
      .sort((a, b) => b.total - a.total);
  }, [sessions, clients, memberships, clientEmailAliases]);

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

  // --- Membership churn rate (last 6 months average) ---
  const churnRate = useMemo(() => {
    const byMonth: Record<string, Set<string>> = {};
    for (const m of memberships) {
      const month = m.date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = new Set();
      byMonth[month].add(m.email);
    }
    // Take last 7 months to get 6 consecutive month pairs
    const sortedMonths = Object.keys(byMonth).sort().slice(-7);
    if (sortedMonths.length < 2) return 0;

    const rates: number[] = [];
    for (let i = 0; i < sortedMonths.length - 1; i++) {
      const current = byMonth[sortedMonths[i]];
      const next = byMonth[sortedMonths[i + 1]];
      const lost = [...current].filter(email => !next.has(email)).length;
      if (current.size > 0) {
        rates.push((lost / current.size) * 100);
      }
    }
    if (rates.length === 0) return 0;
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }, [memberships]);

  // --- How Did You Hear categories ---
  const referralCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of behaviourQuestionnaires) {
      if (q.howDidYouHear) {
        const cat = categorizeReferral(q.howDidYouHear);
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [behaviourQuestionnaires]);

  const payBarData = {
    labels: clientPayTotals.map(c => c.name),
    datasets: [{
      label: 'Grand Total (£)',
      data: clientPayTotals.map(c => c.total),
      backgroundColor: '#92400e',
      borderRadius: 4,
    }],
  };

  const referralBarData = {
    labels: referralCounts.map(([cat]) => cat),
    datasets: [{
      label: 'Responses',
      data: referralCounts.map(([, count]) => count),
      backgroundColor: '#b45309',
      borderRadius: 4,
    }],
  };

  const payBarOptions = {
    ...makeBarOptions('£'),
    scales: {
      ...makeBarOptions('£').scales,
      x: {
        position: 'top' as const,
        ticks: {
          callback: (value: any) => `£${value.toLocaleString()}`,
          color: '#6b7280',
        },
        grid: { color: 'rgba(0,0,0,0.07)' },
      },
      y: {
        ticks: { color: '#374151', font: { size: 12 } },
        grid: { display: false },
      },
    },
  };
  const referralBarOptions = {
    ...makeBarOptions(''),
    scales: {
      ...makeBarOptions('').scales,
      x: {
        ticks: { callback: (v: any) => v, color: '#6b7280' },
        grid: { color: '#f3f4f6' },
      },
      y: {
        ticks: { color: '#374151', font: { size: 12 } },
        grid: { display: false },
      },
    },
    plugins: {
      ...makeBarOptions('').plugins,
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.x} response${ctx.parsed.x !== 1 ? 's' : ''}`,
        },
      },
    },
  };

  const payChartHeight = Math.max(300, clientPayTotals.length * 36);
  const referralChartHeight = Math.max(200, referralCounts.length * 44);

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
            <p className="text-2xl font-bold text-gray-900">{churnRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">avg per month (6 months)</p>
          </div>
        </div>

        {/* How Did You Hear chart */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">How Did You Hear</p>
          {referralCounts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No questionnaire data found</p>
          ) : (
            <div style={{ height: referralChartHeight }}>
              <Bar data={referralBarData} options={referralBarOptions as any} />
            </div>
          )}
        </div>

        {/* Total pay bar chart */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Grand Total by Client</p>
          {clientPayTotals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No paid sessions found</p>
          ) : (
            <div style={{ height: payChartHeight, cursor: 'pointer' }}>
              <Bar
                ref={payChartRef}
                data={payBarData}
                options={payBarOptions}
                onClick={(event) => {
                  const chart = payChartRef.current;
                  if (!chart) return;
                  const elements = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, false);
                  if (elements.length > 0) {
                    const index = elements[0].index;
                    const entry = clientPayTotals[index];
                    if (entry) {
                      setSelectedClient(entry.client);
                      setShowClientModal(true);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      <ClientModal
        client={selectedClient}
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onEditClient={() => {}}
      />
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
