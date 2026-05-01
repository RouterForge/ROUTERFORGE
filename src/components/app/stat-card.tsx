import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
  className?: string;
}

export function StatCard({ label, value, sub, icon: Icon, trend, className }: Props) {
  return (
    <Card className={cn('p-5 flex items-start gap-4', className)}>
      {Icon && (
        <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums truncate">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground truncate">{sub}</div>}
        {trend && (
          <div
            className={cn(
              'mt-1 inline-flex items-center gap-1 text-xs',
              trend.direction === 'up' && 'text-success',
              trend.direction === 'down' && 'text-destructive',
              trend.direction === 'flat' && 'text-muted-foreground',
            )}
          >
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '·'} {trend.value}
          </div>
        )}
      </div>
    </Card>
  );
}
