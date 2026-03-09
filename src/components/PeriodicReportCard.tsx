import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { PublishRecord } from '@/lib/types';
import { FileText, Loader2, Trophy, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import GuestPromptDialog from '@/components/GuestPromptDialog';
import { useGuest } from '@/contexts/GuestContext';

interface ReportData {
  overview: string;
  bestContent: { title: string; reason: string }[];
  improvements: string[];
  trend: string;
  nextActions: string[];
  overallScore: number;
}

interface PeriodicReportCardProps {
  records: PublishRecord[];
}

export default function PeriodicReportCard({ records }: PeriodicReportCardProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const { isGuest } = useGuest();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const getFilteredRecords = () => {
    const now = new Date();
    const threshold = new Date();
    if (period === 'week') threshold.setDate(now.getDate() - 7);
    else threshold.setMonth(now.getMonth() - 1);
    const dateStr = threshold.toISOString().slice(0, 10);
    return records.filter(r => r.publishedAt >= dateStr);
  };

  const handleGenerate = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    const filtered = getFilteredRecords();
    if (filtered.length === 0) { toast.error(`${period === 'week' ? '本周' : '本月'}暂无发布数据`); return; }

    setLoading(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke('periodic-report', {
        body: { records: filtered, period },
      });
      if (error) throw new Error(error.message);
      if (data?.error) { toast.error(data.error); setLoading(false); return; }
      setReport(data);
      toast.success('报告生成完成！');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '报告生成失败');
    } finally { setLoading(false); }
  };

  const filteredCount = getFilteredRecords().length;
  const scoreColor = report ? (report.overallScore >= 80 ? 'text-green-500' : report.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500') : '';

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            周期复盘报告
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Tabs value={period} onValueChange={v => { setPeriod(v as 'week' | 'month'); setReport(null); }}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs h-7">周报</TabsTrigger>
                <TabsTrigger value="month" className="text-xs h-7">月报</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">{filteredCount} 条数据</span>
            <Button size="sm" onClick={handleGenerate} disabled={loading} className="ml-auto">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <BarChart3 className="h-3.5 w-3.5 mr-1" />}
              {loading ? '生成中...' : '生成报告'}
            </Button>
          </div>

          {report && (
            <div className="space-y-4 animate-fade-in">
              {/* Score + Overview */}
              <div className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${scoreColor}`}>{report.overallScore}</div>
                  <div className="text-xs text-muted-foreground">综合评分</div>
                </div>
                <p className="text-sm flex-1">{report.overview}</p>
              </div>

              {/* Best Content */}
              {report.bestContent.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Trophy className="h-3.5 w-3.5 text-yellow-500" /> 最佳表现
                  </h4>
                  <div className="space-y-2">
                    {report.bestContent.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
                        <div className="text-sm font-medium">{item.title}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> 趋势分析
                </h4>
                <p className="text-sm text-muted-foreground p-2.5 rounded-lg bg-muted/50">{report.trend}</p>
              </div>

              {/* Improvements */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> 待改进
                </h4>
                <ul className="space-y-1">
                  {report.improvements.map((item, i) => (
                    <li key={i} className="text-sm flex gap-2 text-muted-foreground">
                      <span className="text-yellow-500 shrink-0">{i + 1}.</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Actions */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" /> 下期建议
                </h4>
                <ul className="space-y-1">
                  {report.nextActions.map((action, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary shrink-0">•</span>{action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="周期报告" />
    </>
  );
}
