
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string;
  trend: string;
  comparisonLabel: string;
  isNegative?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, trend, comparisonLabel, isNegative }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 hover:-translate-y-1.5 hover:scale-[1.02] transform transition-all duration-300 cursor-pointer group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
          <i className="fas fa-chart-line text-[10px]"></i>
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
        <span className={`text-[10px] font-black whitespace-nowrap px-2 py-0.5 rounded-full ${
          isNegative 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
        }`}>
          {trend}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap truncate font-medium">
          {comparisonLabel}
        </span>
      </div>
    </div>
  );
};

export default StatsCard;
