import { useState, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const STEPS = [
  '正在连接 AI 服务...',
  '分析内容中...',
  '生成优化建议...',
  '整理结果...',
];

interface AIProgressBarProps {
  active: boolean;
  className?: string;
  /** Custom step labels */
  steps?: string[];
}

export default function AIProgressBar({ active, className, steps = STEPS }: AIProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (active) {
      setProgress(0);
      setStepIndex(0);

      // Simulate progress: fast at start, slow near end (never reaches 100 until done)
      let p = 0;
      intervalRef.current = setInterval(() => {
        // Logarithmic slowdown: fast to 60, slow to 90, crawl after
        const remaining = 95 - p;
        const increment = Math.max(0.3, remaining * 0.04);
        p = Math.min(95, p + increment);
        setProgress(p);

        // Update step label based on progress
        const idx = Math.min(
          steps.length - 1,
          Math.floor((p / 95) * steps.length)
        );
        setStepIndex(idx);
      }, 150);
    } else {
      // Complete: snap to 100
      if (progress > 0) {
        setProgress(100);
        setTimeout(() => setProgress(0), 600);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  if (!active && progress === 0) return null;

  return (
    <div className={cn('space-y-2 animate-fade-in', className)}>
      <Progress value={progress} className="h-1.5" />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {steps[stepIndex]}
        </p>
        <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
