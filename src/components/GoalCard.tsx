import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Target, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { toast } from 'sonner';
import type { PublishRecord } from '@/lib/types';

interface GoalCardProps {
  records: PublishRecord[];
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRecords(records: PublishRecord[], month: string) {
  return records.filter(r => r.publishedAt.startsWith(month));
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

  const month = getCurrentMonth();
  const monthRecords = getMonthRecords(records, month);

  const currentViews = monthRecords.reduce((s, r) => s + r.views, 0);
  const totalInteractions = monthRecords.reduce((s, r) => s + r.likes + r.comments + r.shares, 0);
  const currentEngagement = currentViews > 0 ? (totalInteractions / currentViews) * 100 : 0;

  useEffect(() => {
    if (isGuest) {
      setViewsTarget(100000);
      setEngagementTarget(5);
      setLoading(false);
      return;
    }
    if (!user) return;

    const fetchGoal = async () => {
      const { data } = await supabase
        .from('user_goals')
        .select('*')
        .eq('month', month)
        .maybeSingle();

      if (data) {
        setViewsTarget(data.views_target as number);
        setEngagementTarget(Number(data.engagement_target));
        setGoalId(data.id);
      }
      setLoading(false);
    };
    fetchGoal();
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

  const monthLabel = `${month.split('-')[0]}年${parseInt(month.split('-')[1])}月`;

  if (loading) return null;

  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {monthLabel}目标
          </CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={startEdit}>
              <Pencil className="h-3 w-3" /> {hasGoals ? '修改' : '设定目标'}
            </Button>
          )}
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
      </CardContent>
    </Card>
  );
}
