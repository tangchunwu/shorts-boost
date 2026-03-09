import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  /** Page type for layout-appropriate skeletons */
  variant?: 'dashboard' | 'list' | 'calendar' | 'analyze' | 'default';
  className?: string;
}

function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer', className)} />;
}

/** Header skeleton: title + subtitle */
function HeaderSkeleton({ hasAction = false }: { hasAction?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <ShimmerBlock className="h-7 w-40" />
        <ShimmerBlock className="h-3.5 w-56" />
      </div>
      {hasAction && <ShimmerBlock className="h-9 w-28 rounded-xl" />}
    </div>
  );
}

/** Stat cards skeleton */
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-3 stagger-grid`}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerBlock key={i} className="h-[88px] rounded-[var(--radius)]" />
      ))}
    </div>
  );
}

/** List items skeleton */
function ListSkeleton({ count = 3, itemHeight = 'h-20' }: { count?: number; itemHeight?: string }) {
  return (
    <div className="space-y-3 stagger-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerBlock key={i} className={`${itemHeight} rounded-[var(--radius)]`} />
      ))}
    </div>
  );
}

/** Tab bar skeleton */
function TabsSkeleton() {
  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
      <ShimmerBlock className="h-8 w-24 rounded-lg" />
      <ShimmerBlock className="h-8 w-24 rounded-lg" />
      <ShimmerBlock className="h-8 w-28 rounded-lg" />
    </div>
  );
}

/** Chart area skeleton */
function ChartSkeleton({ height = 'h-48' }: { height?: string }) {
  return <ShimmerBlock className={`${height} rounded-[var(--radius)]`} />;
}

export default function PageSkeleton({ variant = 'default', className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-6 page-enter', className)}>
      {variant === 'dashboard' && (
        <>
          <HeaderSkeleton hasAction />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ShimmerBlock className="h-[76px] rounded-[var(--radius)]" />
            <ShimmerBlock className="h-[76px] rounded-[var(--radius)]" />
          </div>
          <StatsSkeleton count={4} />
          <ChartSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartSkeleton height="h-64" />
            <ChartSkeleton height="h-64" />
          </div>
        </>
      )}

      {variant === 'list' && (
        <>
          <HeaderSkeleton hasAction />
          <div className="flex gap-2">
            <ShimmerBlock className="h-9 w-48 rounded-xl" />
            <ShimmerBlock className="h-9 w-32 rounded-xl" />
          </div>
          <ListSkeleton count={4} itemHeight="h-24" />
        </>
      )}

      {variant === 'calendar' && (
        <>
          <HeaderSkeleton hasAction />
          <div className="flex items-center justify-between">
            <ShimmerBlock className="h-8 w-8 rounded-lg" />
            <ShimmerBlock className="h-6 w-32" />
            <ShimmerBlock className="h-8 w-8 rounded-lg" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <ShimmerBlock key={`h-${i}`} className="h-6 rounded-md" />
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </>
      )}

      {variant === 'analyze' && (
        <>
          <HeaderSkeleton />
          <TabsSkeleton />
          <ShimmerBlock className="h-52 rounded-[var(--radius)]" />
          <ListSkeleton count={2} itemHeight="h-32" />
        </>
      )}

      {variant === 'default' && (
        <>
          <HeaderSkeleton hasAction />
          <ListSkeleton count={3} />
        </>
      )}
    </div>
  );
}

export { ShimmerBlock, HeaderSkeleton, StatsSkeleton, ListSkeleton, TabsSkeleton, ChartSkeleton };
