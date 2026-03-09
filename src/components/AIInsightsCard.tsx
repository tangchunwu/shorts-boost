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

const INSIGHT_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
  trend: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  anomaly: { icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
  tip: { icon: Lightbulb, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
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
    if (records.length === 0) {
      toast.error('暂无发布记录，无法分析');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { records: records.slice(0, 50) },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      const newInsights = data.insights || [];
      setInsights(newInsights);
      setRawContent(data.rawContent || '');
      setHasLoaded(true);
      onInsightsChange?.(newInsights);
    } catch (e: any) {
      console.error('AI insights error:', e);
      toast.error('AI 洞察分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in-up overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            AI 智能洞察
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={loading || records.length === 0}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {hasLoaded ? '刷新' : '生成洞察'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading && (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              基于你的发布数据，AI 将自动分析趋势、发现异常并给出增长建议
            </p>
            <Button
              onClick={fetchInsights}
              disabled={records.length === 0}
              size="sm"
              className="gap-2"
              style={{ backgroundImage: 'var(--gradient-primary)' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              开始分析
            </Button>
            {records.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">需要先添加发布记录</p>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">AI 正在分析你的数据...</span>
          </div>
        )}

        {hasLoaded && !loading && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.tip;
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
                >
                  <div className={`rounded-lg p-1.5 shrink-0 ${config.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasLoaded && !loading && insights.length === 0 && rawContent && (
          <div className="p-3 rounded-xl bg-secondary/40">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rawContent}</p>
          </div>
        )}
      </CardContent>
      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="AI 洞察" />
    </Card>
  );
}
