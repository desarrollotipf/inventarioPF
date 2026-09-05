import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon: LucideIcon;
  color?: 'fiesta' | 'blue' | 'emerald' | 'amber' | 'purple' | 'red';
  trend?: string | { value: number | string; isPositive?: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  color = 'fiesta',
  trend,
}) => {
  const displaySubtitle = subtitle || description;
  const monoScheme = {
    bg: 'bg-neutral-900/90 border-neutral-800 text-neutral-100',
    glow: 'group-hover:border-neutral-500',
    iconBg: 'bg-neutral-800 text-white border border-neutral-700',
  };

  const scheme = monoScheme;

  const renderTrend = () => {
    if (!trend) return null;
    if (typeof trend === 'string') {
      return <span className="text-neutral-300">{trend}</span>;
    }
    const isPos = trend.isPositive !== false;
    return (
      <div className="flex items-center gap-1.5 font-bold text-neutral-300">
        {isPos ? <TrendingUp className="w-3.5 h-3.5 text-white" /> : <TrendingDown className="w-3.5 h-3.5 text-neutral-400" />}
        <span>{trend.value}% Operatividad</span>
      </div>
    );
  };

  return (
    <div className={`glass-card p-5 rounded-2xl relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 ${scheme.glow}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight text-white">{value}</p>
          {displaySubtitle && <p className="text-xs text-slate-400 font-medium">{displaySubtitle}</p>}
        </div>
        <div className={`p-3.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center text-xs text-slate-400">
          {renderTrend()}
        </div>
      )}
    </div>
  );
};
