import { cn } from '@/lib/utils';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}

/**
 * Custom recharts tooltip with zen-card styling
 */
export default function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl bg-card px-4 py-3 text-sm" style={{ boxShadow: 'var(--shadow-float)', border: '1px solid var(--glass-border-outer)' }}>
      {label && (
        <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-xs text-muted-foreground">{entry.name || entry.dataKey}</span>
            <span className="text-xs font-bold text-foreground ml-auto tabular-nums">
              {formatter ? formatter(entry.value, entry.name) : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
