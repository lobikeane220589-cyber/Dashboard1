
import React, { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { TimeRange, AdMetric, CalculatedMetrics, CustomDateRange, AdAccount, Campaign, User } from '../types';
import { generateMockMetrics } from '../mockData';
import { facebookService } from '../facebookService';
import { supabaseService } from '../supabaseService';
import StatsCard from './StatsCard';

interface DashboardProps {
  accounts: AdAccount[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  campaigns: Campaign[];
  selectedCampaignId: string;
  onCampaignChange: (id: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  customRange: CustomDateRange;
  onCustomRangeChange: (range: CustomDateRange) => void;
  isLive?: boolean;
}

interface ApiError {
  message: string;
  code?: number;
  subcode?: number;
  type?: string;
}

type SortKey = 'date' | 'spend' | 'leads' | 'messaging' | 'conversions' | 'roas';
type SortDirection = 'asc' | 'desc';
type SpendingChartType = 'area' | 'bar';

const Dashboard: React.FC<DashboardProps> = ({ 
  accounts, selectedAccountId, onAccountChange, 
  campaigns, selectedCampaignId, onCampaignChange,
  timeRange, onTimeRangeChange,
  customRange, onCustomRangeChange,
  isLive
}) => {
  const [apiData, setApiData] = useState<AdMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [spendingChartType, setSpendingChartType] = useState<SpendingChartType>('area');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'date', 
    direction: 'desc' 
  });

  const ranges = useMemo(() => {
    const now = new Date();
    const end = new Date();
    const start = new Date();
    let compLabel = 'к прош. периоду';

    if (timeRange === TimeRange.CUSTOM) {
      const s = new Date(customRange.startDate);
      const e = new Date(customRange.endDate);
      const diff = e.getTime() - s.getTime();
      const prevStart = new Date(s.getTime() - diff - 86400000);
      const prevEnd = new Date(s.getTime() - 86400000);
      compLabel = 'к предыд. отрезку';
      return {
        current: customRange,
        previous: {
          startDate: prevStart.toISOString().split('T')[0],
          endDate: prevEnd.toISOString().split('T')[0]
        },
        label: compLabel
      };
    }

    switch (timeRange) {
      case TimeRange.TODAY:
        start.setDate(now.getDate());
        compLabel = 'ко вчера';
        break;
      case TimeRange.LAST_7:
        start.setDate(now.getDate() - 6);
        compLabel = 'к прош. 7 дн.';
        break;
      case TimeRange.LAST_30:
        start.setDate(now.getDate() - 29);
        compLabel = 'к прош. 30 дн.';
        break;
      case TimeRange.PREV_MONTH: {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const firstDayPrevPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const lastDayPrevPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        return {
          current: { startDate: firstDayLastMonth.toISOString().split('T')[0], endDate: lastDayLastMonth.toISOString().split('T')[0] },
          previous: { startDate: firstDayPrevPrevMonth.toISOString().split('T')[0], endDate: lastDayPrevPrevMonth.toISOString().split('T')[0] },
          label: 'к позапрошл. мес.'
        };
      }
      case TimeRange.YEAR:
        start.setDate(now.getDate() - 364);
        compLabel = 'к прош. году';
        break;
      default:
        start.setDate(now.getDate() - 29);
    }

    const currentRange = { 
      startDate: start.toISOString().split('T')[0], 
      endDate: end.toISOString().split('T')[0] 
    };

    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);

    return {
      current: currentRange,
      previous: {
        startDate: prevStart.toISOString().split('T')[0],
        endDate: prevEnd.toISOString().split('T')[0]
      },
      label: compLabel
    };
  }, [timeRange, customRange]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const extendedRange = {
      startDate: ranges.previous.startDate,
      endDate: ranges.current.endDate
    };

    if (isLive) {
      const targetId = selectedCampaignId === 'all' ? selectedAccountId : selectedCampaignId;
      try {
        let finalData: AdMetric[] = [];
        
        if (targetId === 'all') {
          for (const acc of accounts) {
            const res = await facebookService.getInsights(acc.id, extendedRange);
            finalData.push(...res);
          }
        } else {
          finalData = await facebookService.getInsights(targetId, extendedRange);
        }

        if (finalData.length > 0) {
          await supabaseService.saveMetrics(finalData);
        }

        setApiData(finalData);
      } catch (err: any) {
        console.warn("FB API Error, trying Supabase fallback...", err);
        const fallbackData = await supabaseService.getStoredMetrics(targetId, extendedRange.startDate, extendedRange.endDate);
        if (fallbackData.length > 0) setApiData(fallbackData);
        else {
          let friendlyMessage = 'Не удалось загрузить данные из Facebook.';
          if (err.code === 190 || err.code === 102) friendlyMessage = 'Сессия Facebook истекла.';
          else if (err.message) friendlyMessage = err.message;
          setError({ message: friendlyMessage, code: err.code, type: err.type });
        }
      }
    } else {
      const mockRes: AdMetric[] = [];
      const campsToProcess = selectedCampaignId === 'all' ? campaigns : campaigns.filter(c => c.id === selectedCampaignId);
      campsToProcess.forEach(c => mockRes.push(...generateMockMetrics(c.id)));
      setApiData(mockRes);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedAccountId, selectedCampaignId, ranges, isLive, campaigns, accounts]);

  const currentFilteredData = useMemo(() => {
    const combined: { [date: string]: AdMetric } = {};
    apiData.forEach(m => {
      if (m.date >= ranges.current.startDate && m.date <= ranges.current.endDate) {
        if (!combined[m.date]) combined[m.date] = { ...m };
        else {
          combined[m.date].spend += m.spend;
          combined[m.date].clicks += m.clicks;
          combined[m.date].impressions += m.impressions;
          combined[m.date].leads += m.leads;
          combined[m.date].messaging += m.messaging;
          combined[m.date].conversions += m.conversions;
          combined[m.date].revenue += m.revenue;
        }
      }
    });
    return Object.values(combined).sort((a, b) => a.date.localeCompare(b.date));
  }, [apiData, ranges.current]);

  const tableData = useMemo(() => {
    let filtered = currentFilteredData.filter(row => 
      row.date.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      if (sortConfig.key === 'roas') {
        aVal = a.revenue / a.spend || 0;
        bVal = b.revenue / b.spend || 0;
      } else {
        aVal = a[sortConfig.key as keyof AdMetric];
        bVal = b[sortConfig.key as keyof AdMetric];
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [currentFilteredData, searchTerm, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = ['Дата', 'Расход', 'Клики', 'Показы', 'Переписки', 'Лиды', 'Заказы', 'Выручка', 'ROAS'];
    const rows = tableData.map(row => [
      row.date, row.spend.toFixed(2), row.clicks, row.impressions, row.messaging, row.leads, row.conversions, row.revenue.toFixed(2), (row.revenue / row.spend || 0).toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FB_Ads_Report.csv`);
    link.click();
  };

  const getTotals = (data: AdMetric[], range: CustomDateRange): CalculatedMetrics => {
    const items = data.filter(m => m.date >= range.startDate && m.date <= range.endDate);
    const sum = items.reduce((acc, curr) => ({
        spend: acc.spend + curr.spend,
        clicks: acc.clicks + curr.clicks,
        impressions: acc.impressions + curr.impressions,
        leads: acc.leads + curr.leads,
        messaging: acc.messaging + curr.messaging,
        conversions: acc.conversions + curr.conversions,
        revenue: acc.revenue + curr.revenue,
      }), { spend: 0, clicks: 0, impressions: 0, leads: 0, messaging: 0, conversions: 0, revenue: 0 });

    return {
      ...sum,
      ctr: sum.impressions > 0 ? (sum.clicks / sum.impressions) * 100 : 0,
      cpc: sum.clicks > 0 ? sum.spend / sum.clicks : 0,
      cpa: sum.conversions > 0 ? sum.spend / sum.conversions : 0,
      cpl: sum.leads > 0 ? sum.spend / sum.leads : 0,
      roas: sum.spend > 0 ? sum.revenue / sum.spend : 0,
    };
  };

  const currentTotals = useMemo(() => getTotals(apiData, ranges.current), [apiData, ranges.current]);
  const prevTotals = useMemo(() => getTotals(apiData, ranges.previous), [apiData, ranges.previous]);

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const diff = ((curr - prev) / prev) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <i className="fas fa-sort ml-1 opacity-20 text-[8px]"></i>;
    return sortConfig.direction === 'asc' ? <i className="fas fa-sort-up ml-1 text-indigo-600"></i> : <i className="fas fa-sort-down ml-1 text-indigo-600"></i>;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
            Расход: ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">Рекламный аккаунт</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm text-slate-800 dark:text-slate-200"
              value={selectedAccountId}
              onChange={(e) => onAccountChange(e.target.value)}
            >
              <option value="all">Все кабинеты</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">Кампания</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-slate-800 dark:text-slate-200"
              value={selectedCampaignId}
              onChange={(e) => onCampaignChange(e.target.value)}
              disabled={selectedAccountId === 'all'}
            >
              <option value="all">Все кампании</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">Период</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm text-slate-800 dark:text-slate-200"
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
            >
              {Object.values(TimeRange).map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
           <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-slate-500 text-sm font-medium">Синхронизация данных...</p>
        </div>
      ) : tableData.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 shadow-sm">
          <i className="fas fa-chart-bar text-4xl mb-3 opacity-20"></i>
          <p className="font-medium">Нет данных для отображения</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <StatsCard label="Расход" value={`$${currentTotals.spend.toLocaleString()}`} trend={calcTrend(currentTotals.spend, prevTotals.spend)} comparisonLabel={ranges.label} isNegative={currentTotals.spend > prevTotals.spend} />
            <StatsCard label="Переписки" value={currentTotals.messaging.toLocaleString()} trend={calcTrend(currentTotals.messaging, prevTotals.messaging)} comparisonLabel={ranges.label} isNegative={currentTotals.messaging < prevTotals.messaging} />
            <StatsCard label="Лиды" value={currentTotals.leads.toLocaleString()} trend={calcTrend(currentTotals.leads, prevTotals.leads)} comparisonLabel={ranges.label} isNegative={currentTotals.leads < prevTotals.leads} />
            <StatsCard label="Заказы" value={currentTotals.conversions.toLocaleString()} trend={calcTrend(currentTotals.conversions, prevTotals.conversions)} comparisonLabel={ranges.label} isNegative={currentTotals.conversions < prevTotals.conversions} />
            <StatsCard label="Выручка" value={`$${currentTotals.revenue.toLocaleString()}`} trend={calcTrend(currentTotals.revenue, prevTotals.revenue)} comparisonLabel={ranges.label} isNegative={currentTotals.revenue < prevTotals.revenue} />
            <StatsCard label="ROAS" value={`${currentTotals.roas.toFixed(2)}x`} trend={calcTrend(currentTotals.roas, prevTotals.roas)} comparisonLabel={ranges.label} isNegative={currentTotals.roas < prevTotals.roas} />
          </div>

          {/* График динамики расходов */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Динамика расходов</h3>
                <p className="text-[10px] text-slate-400 font-medium">Расход по дням за выбранный период</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setSpendingChartType('area')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${spendingChartType === 'area' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  <i className="fas fa-chart-area mr-1.5"></i> Область
                </button>
                <button 
                  onClick={() => setSpendingChartType('bar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${spendingChartType === 'bar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  <i className="fas fa-chart-bar mr-1.5"></i> Столбцы
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {spendingChartType === 'area' ? (
                  <AreaChart data={currentFilteredData}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4}/>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="spend" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSpend)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={currentFilteredData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4}/>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="spend" 
                      fill="#4f46e5" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                    >
                      {currentFilteredData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#4f46e5" opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors h-fit max-h-[70vh]">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-white dark:bg-slate-900 z-20">
               <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Детальная статистика по дням</h3>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-800"
                  >
                    <i className="fas fa-download"></i> Экспорт
                  </button>
               </div>
             </div>
             <div className="overflow-auto flex-1 custom-scrollbar">
               <table className="w-full text-left text-sm table-fixed min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('date')}>Дата <SortIndicator column="date" /></th>
                      <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('spend')}>Расход <SortIndicator column="spend" /></th>
                      <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('messaging')}>Переписки <SortIndicator column="messaging" /></th>
                      <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('leads')}>Лиды <SortIndicator column="leads" /></th>
                      <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('conversions')}>Заказы <SortIndicator column="conversions" /></th>
                      <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('roas')}>ROAS <SortIndicator column="roas" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tableData.map((row, idx) => (
                      <tr 
                        key={`${selectedAccountId}-${selectedCampaignId}-${row.date}`} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors animate-row"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium tabular-nums-transition">{row.date}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 tabular-nums-transition">${row.spend.toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-800 dark:text-slate-300 tabular-nums-transition">{row.messaging}</td>
                        <td className="px-6 py-4 text-slate-800 dark:text-slate-300 tabular-nums-transition">{row.leads}</td>
                        <td className="px-6 py-4 text-slate-800 dark:text-slate-300 tabular-nums-transition">{row.conversions}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors duration-500 ${(row.revenue/row.spend || 0) >= 2 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                            {(row.revenue/row.spend || 0).toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
