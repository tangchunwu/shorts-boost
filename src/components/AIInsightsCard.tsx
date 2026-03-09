import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { PublishRecord } from '@/lib/types';
import { toast } from 'sonner';
import { useGuest } from '@/contexts/GuestContext';
import GuestPromptDialog from '@/components/GuestPromptDialog';

export interface Insight {
  type: 'trend' | 'anomaly' | 'tip' | 'warning';
  title: string;
  description: string;
}

const INSIGHT_CONFIG: Record<string, { icon: typeof TrendingUp; color: string }> = {
  trend: { icon: TrendingUp, color: 'text-foreground' },
  anomaly: { icon: Activity, color: 'text-destructive' },
  tip: { icon: Lightbulb, color: 'text-success' },
  warning: { icon: AlertTriangle, color: 'text-warning' },
};

interface Props {
  records: PublishRecord[];
  onInsightsChange?: (insights: Insight[]) => void;
}

export default function AIInsightsCard({ records, onInsightsChange }: Props) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [rawContent, setRawContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isGuest } = useGuest();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const fetchInsights = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    if (records.length === 0) { toast.error('暂无发布记录'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { records: records.slice(0, 50) },
      });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
      const newInsights = data.insights || [];
      setInsights(newInsights);
      setRawContent(data.rawContent || '');
      setHasLoaded(true);
      onInsightsChange?.(newInsights);
    } catch (e: any) {
      console.error('AI insights error:', e);
      toast.error('AI 洞察分析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in-up overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-input" style={{ boxShadow: 'var(--shadow-inset)' }}>
              <Sparkles className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold">AI 智能洞察</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={loading || records.length === 0}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            {hasLoaded ? '刷新' : '生成洞察'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading && (
          <div className="text-center py-10">
            <div className="rounded-[28px] bg-input p-5 inline-block mb-4" style={{ boxShadow: 'var(--shadow-inset)' }}>
              <Sparkles className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              基于发布数据，AI 将分析趋势、发现异常并给出增长建议
            </p>
            <Button
              onClick={fetchInsights}
              disabled={records.length === 0}
              size="sm"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              开始分析
            </Button>
            {records.length === 0 && (
              <p className="zen-label mt-3">需要先添加发布记录</p>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-10 gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            <span className="text-sm text-muted-foreground">AI 正在分析…</span>
          </div>
        )}

        {hasLoaded && !loading && insights.length > 0 && (
          <div className="space-y-2.5">
            {insights.map((insight, i) => {
              const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.tip;
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-input transition-all duration-200"
                  style={{ boxShadow: 'var(--shadow-inset)' }}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasLoaded && !loading && insights.length === 0 && rawContent && (
          <div className="p-4 rounded-2xl bg-input" style={{ boxShadow: 'var(--shadow-inset)' }}>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rawContent}</p>
          </div>
        )}
      </CardContent>
      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="AI 洞察" />
    </Card>
  );
}
