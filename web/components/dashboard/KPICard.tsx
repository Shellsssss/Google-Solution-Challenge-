import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const colorMap = {
  blue: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  green: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  red: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' },
  yellow: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
};

export default function KPICard({
  title,
  value,
  subtitle,
  trend = 'neutral',
  trendLabel,
  icon,
  color = 'blue',
}: KPICardProps) {
  const colors = colorMap[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted';

  return (
    <div className={cn('rounded-2xl border p-6 bg-background-card', colors.border)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted font-medium">{title}</p>
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
            <span className={colors.text}>{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className={cn('text-3xl font-bold mb-1', colors.text)}>{value}</div>

      {/* Subtitle / Trend */}
      {(subtitle || trendLabel) && (
        <div className="flex items-center gap-1.5">
          <TrendIcon className={cn('h-3.5 w-3.5', trendColor)} />
          <span className={cn('text-xs', trendColor)}>{trendLabel ?? subtitle}</span>
          {subtitle && trendLabel && (
            <span className="text-xs text-muted">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
