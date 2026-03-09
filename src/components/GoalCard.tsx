import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Target, Pencil, Check, X, History, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartTooltip from '@/components/ChartTooltip';
import type { PublishRecord } from '@/lib/types';

interface GoalCardProps {
  records: PublishRecord[];
}

interface GoalRow {
  id: string;
  month: string;
  views_target: number;
  engagement_target: number;
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRecords(records: PublishRecord[], month: string) {
  return records.filter(r => r.publishedAt.startsWith(month));
}

function formatMonth(m: string) {
  const [y, mo] = m.split('-');
  return `${y}年${parseInt(mo)}月`;
}

function shortMonth(m: string) {
  return `${parseInt(m.split('-')[1])}月`;
}

export default function GoalCard({ records }: GoalCardProps) {
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const [editing, setEditing] = useState(false);
  const [viewsTarget, setViewsTarget] = useState(0);
  const [engagementTarget, setEngagementTarget] = useState(0);
  const [draftViews, setDraftViews] = useState('');
  const [draftEngagement, setDraftEngagement] = useState('');
  const [loading, setLoading] = useState(true);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyGoals, setHistoryGoals] = useState<GoalRow[]>([]);

  const month = getCurrentMonth();
  const monthRecords = getMonthRecords(records, month);

  const currentViews = monthRecords.reduce((s, r) => s + r.views, 0);
  const totalInteractions = monthRecords.reduce((s, r) => s + r.likes + r.comments + r.shares, 0);
  const currentEngagement = currentViews > 0 ? (totalInteractions / currentViews) * 100 : 0;

  useEffect(() => {
    if (isGuest) {
      setViewsTarget(100000);
      setEngagementTarget(5);
      setHistoryGoals([
        { id: '1', month: '2026-01', views_target: 80000, engagement_target: 4 },
        { id: '2', month: '2026-02', views_target: 90000, engagement_target: 4.5 },
      ]);
      setLoading(false);
      return;
    }
    if (!user) return;

    const fetchGoals = async () => {
      const { data } = await supabase
        .from('user_goals')
        .select('*')
        .order('month', { ascending: true });

      if (data) {
        const current = data.find((g: any) => g.month === month);
        if (current) {
          setViewsTarget(current.views_target as number);
          setEngagementTarget(Number(current.engagement_target));
          setGoalId(current.id);
        }
        const past = (data as any[])
          .filter((g: any) => g.month !== month)
          .map((g: any) => ({
            id: g.id,
            month: g.month,
            views_target: g.views_target as number,
            engagement_target: Number(g.engagement_target),
          }));
        setHistoryGoals(past);
      }
      setLoading(false);
    };
    fetchGoals();
  }, [user, isGuest, month]);

  const handleSave = async () => {
    const vt = Math.max(0, parseInt(draftViews) || 0);
    const et = Math.max(0, Math.min(100, parseFloat(draftEngagement) || 0));

    if (isGuest) {
      setViewsTarget(vt);
      setEngagementTarget(et);
      setEditing(false);
      toast.success('目标已更新（访客模式）');
      return;
    }

    if (!user) return;

    const payload = {
      user_id: user.id,
      month,
      views_target: vt,
      engagement_target: et,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (goalId) {
      ({ error } = await supabase.from('user_goals').update(payload).eq('id', goalId));
    } else {
      const res = await supabase.from('user_goals').insert(payload).select().single();
      error = res.error;
      if (res.data) setGoalId(res.data.id);
    }

    if (error) {
      toast.error('保存失败');
      return;
    }

    setViewsTarget(vt);
    setEngagementTarget(et);
    setEditing(false);
    toast.success('月度目标已保存');
  };

  const startEdit = () => {
    setDraftViews(String(viewsTarget || ''));
    setDraftEngagement(String(engagementTarget || ''));
    setEditing(true);
  };

  const hasGoals = viewsTarget > 0 || engagementTarget > 0;
  const viewsProgress = viewsTarget > 0 ? Math.min(100, (currentViews / viewsTarget) * 100) : 0;
  const engagementProgress = engagementTarget > 0 ? Math.min(100, (currentEngagement / engagementTarget) * 100) : 0;

  const monthLabel = formatMonth(month);

  // Build history chart data (including current month)
  const historyChartData = useMemo(() => {
    const allGoals = [
      ...historyGoals,
      ...(hasGoals ? [{ id: goalId || 'current', month, views_target: viewsTarget, engagement_target: engagementTarget }] : []),
    ].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    return allGoals.map(g => {
      const mr = getMonthRecords(records, g.month);
      const views = mr.reduce((s, r) => s + r.views, 0);
      const interactions = mr.reduce((s, r) => s + r.likes + r.comments + r.shares, 0);
      const eng = views > 0 ? (interactions / views) * 100 : 0;
      const viewsRate = g.views_target > 0 ? Math.min(100, (views / g.views_target) * 100) : 0;
      const isCurrent = g.month === month;
      return {
        month: shortMonth(g.month),
        fullMonth: g.month,
        viewsTarget: g.views_target,
        viewsActual: views,
        viewsRate: Math.round(viewsRate),
        engTarget: g.engagement_target,
        engActual: parseFloat(eng.toFixed(2)),
        isCurrent,
      };
    });
  }, [historyGoals, records, month, hasGoals, viewsTarget, engagementTarget, goalId]);

  // Compute month-over-month trend
  const trend = useMemo(() => {
    if (historyChartData.length < 2) return null;
    const prev = historyChartData[historyChartData.length - 2];
    const curr = historyChartData[historyChartData.length - 1];
    const viewsDiff = curr.viewsRate - prev.viewsRate;
    return { viewsDiff };
  }, [historyChartData]);

  if (loading) return null;

  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {monthLabel}目标
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                trend.viewsDiff > 0 ? 'bg-emerald-500/10 text-emerald-600' : trend.viewsDiff < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
              }`}>
                {trend.viewsDiff > 0 ? <TrendingUp className="h-3 w-3" /> : trend.viewsDiff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {trend.viewsDiff > 0 ? '+' : ''}{trend.viewsDiff}%
              </span>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {historyGoals.length > 0 && !editing && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowHistory(v => !v)}>
                <History className="h-3 w-3" />
                历史
                {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}
            {!editing && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={startEdit}>
                <Pencil className="h-3 w-3" /> {hasGoals ? '修改' : '设定目标'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">月度播放量目标</label>
              <Input
                type="number"
                placeholder="例如 100000"
                value={draftViews}
                onChange={e => setDraftViews(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">互动率目标 (%)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="例如 5.0"
                value={draftEngagement}
                onChange={e => setDraftEngagement(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1">
                <X className="h-3 w-3" /> 取消
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1">
                <Check className="h-3 w-3" /> 保存
              </Button>
            </div>
          </div>
        ) : hasGoals ? (
          <div className="space-y-5">
            {viewsTarget > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">播放量</span>
                  <span className="font-semibold tabular-nums">
                    {currentViews.toLocaleString()} <span className="text-muted-foreground font-normal">/ {viewsTarget.toLocaleString()}</span>
                  </span>
                </div>
                <Progress value={viewsProgress} className="h-2" />
                <p className="text-[11px] text-muted-foreground text-right">
                  {viewsProgress >= 100 ? '🎉 已达成！' : `还差 ${(viewsTarget - currentViews).toLocaleString()} 播放`}
                </p>
              </div>
            )}
            {engagementTarget > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">互动率</span>
                  <span className="font-semibold tabular-nums">
                    {currentEngagement.toFixed(2)}% <span className="text-muted-foreground font-normal">/ {engagementTarget}%</span>
                  </span>
                </div>
                <Progress value={engagementProgress} className="h-2" />
                <p className="text-[11px] text-muted-foreground text-right">
                  {engagementProgress >= 100 ? '🎉 已达成！' : `距目标还差 ${(engagementTarget - currentEngagement).toFixed(2)}%`}
                </p>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              本月已发布 {monthRecords.length} 条视频
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">设定月度目标，追踪你的增长进度 🎯</p>
            <Button variant="outline" size="sm" onClick={startEdit}>设定目标</Button>
          </div>
        )}

        {/* History section */}
        {showHistory && historyGoals.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border space-y-4 animate-fade-in">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              目标完成趋势
            </h4>

            {/* Bar chart showing completion rates */}
            {historyChartData.length > 0 && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyChartData} barCategoryGap="20%">
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 'auto']} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                    <Bar dataKey="viewsRate" name="播放达成率" radius={[4, 4, 0, 0]}>
                      {historyChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.isCurrent
                            ? 'hsl(var(--primary))'
                            : entry.viewsRate >= 100
                              ? 'hsl(var(--success))'
                              : 'hsl(var(--muted-foreground) / 0.25)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* History list */}
            <div className="space-y-2">
              {[...historyGoals].reverse().slice(0, 6).map(g => {
                const mr = getMonthRecords(records, g.month);
                const views = mr.reduce((s, r) => s + r.views, 0);
                const interactions = mr.reduce((s, r) => s + r.likes + r.comments + r.shares, 0);
                const eng = views > 0 ? (interactions / views) * 100 : 0;
                const viewsRate = g.views_target > 0 ? (views / g.views_target) * 100 : 0;
                const engRate = g.engagement_target > 0 ? (eng / g.engagement_target) * 100 : 0;
                const viewsAchieved = viewsRate >= 100;
                const engAchieved = engRate >= 100;

                return (
                  <div key={g.id} className="rounded-xl bg-secondary/40 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{formatMonth(g.month)}</span>
                      <span className="text-[10px] text-muted-foreground">{mr.length} 条视频</span>
                    </div>
                    {g.views_target > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-12 shrink-0">播放量</span>
                        <Progress value={Math.min(100, viewsRate)} className="h-1.5 flex-1" />
                        <span className={`text-[11px] font-medium tabular-nums w-16 text-right ${viewsAchieved ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {viewsAchieved ? '✅' : `${Math.round(viewsRate)}%`}
                        </span>
                      </div>
                    )}
                    {g.engagement_target > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-12 shrink-0">互动率</span>
                        <Progress value={Math.min(100, engRate)} className="h-1.5 flex-1" />
                        <span className={`text-[11px] font-medium tabular-nums w-16 text-right ${engAchieved ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {engAchieved ? '✅' : `${Math.round(engRate)}%`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
