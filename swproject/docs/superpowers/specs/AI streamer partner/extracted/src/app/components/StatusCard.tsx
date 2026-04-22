import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  status?: 'active' | 'inactive' | 'warning';
  subtitle?: string;
  badge?: string;
}

export function StatusCard({ title, value, icon: Icon, status = 'inactive', subtitle, badge }: StatusCardProps) {
  const statusColors = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  return (
    <div className={`border rounded-xl p-5 ${statusColors[status]} relative`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        {status === 'active' && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs opacity-70">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
      </div>
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}