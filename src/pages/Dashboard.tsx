import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRecords, getAnalyses } from '@/lib/storage';
import { PLATFORM_LABELS, type PublishRecord } from '@/lib/types';
import { Search, FileText, TrendingUp, Eye, ThumbsUp, MessageSquare, Sparkles, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '@/components/EmptyState';

export default function Dashboard() {
  const navigate = useNavigate();
  const records = useMemo(() => getRecords(), []);
  const analyses = useMemo(() => getAnalyses(), []);

  const totalViews = records.reduce((s, r) => s + r.views, 0);
  const totalLikes = records.reduce((s, r) => s + r.likes, 0);
  const avgViews = records.length ? Math.round(totalViews / records.length) : 0;

  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)).slice(-30);
    return sorted.map(r => ({
      date: r.publishedAt.slice(5, 10),
      views: r.views,
      likes: r.likes,
    }));
  }, [records]);

  const recentRecords = records.slice(0, 5);

  const stats = [
    { label: '总发布数', value: records.length, icon: FileText, color: 'bg-primary/10 text-primary' },
    { label: '总播放量', value: totalViews.toLocaleString(), icon: Eye, color: 'bg-accent/10 text-accent' },
    { label: '总点赞数', value: totalLikes.toLocaleString(), icon: ThumbsUp, color: 'bg-success/10 text-success' },
    { label: '平均播放', value: avgViews.toLocaleString(), icon: TrendingUp, color: 'bg-warning/10 text-warning' },
  ];

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground text-sm mt-1">短视频数据概览与快速操作</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button onClick={() => navigate('/analyze')} className="h-auto py-4 justify-start gap-3 card-hover" style={{ backgroundImage: 'var(--gradient-primary)' }}>
          <div className="rounded-lg bg-primary-foreground/15 p-2">
            <Search className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold">新建 SEO 分析</div>
            <div className="text-xs opacity-80">AI 优化标题和关键词</div>
          </div>
        </Button>
        <Button onClick={() => navigate('/records')} variant="outline" className="h-auto py-4 justify-start gap-3 card-hover">
          <div className="rounded-lg bg-muted p-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <div className="font-semibold">添加发布记录</div>
            <div className="text-xs text-muted-foreground">记录和复盘视频表现</div>
          </div>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <Card key={label} className={`card-hover animate-fade-in-up animate-stagger-${i + 1}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`rounded-lg p-1.5 ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className="text-xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card className="animate-fade-in-up animate-stagger-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">播放量趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(250, 75%, 58%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(250, 75%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" stroke="hsl(250, 75%, 58%)" fill="url(#viewsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent records */}
      {recentRecords.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">最近发布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 transition-colors hover:bg-secondary/30 rounded px-2 -mx-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[r.platform]} · {r.publishedAt}</p>
                </div>
                <div className="text-sm font-medium text-right shrink-0 ml-4">
                  {r.views.toLocaleString()} 播放
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {records.length === 0 && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-0">
            <EmptyState
              icon={BarChart3}
              title="还没有发布记录"
              description="开始添加你的短视频数据，追踪增长趋势 🚀"
              actionLabel="添加第一条记录"
              onAction={() => navigate('/records')}
            />
            {/* Onboarding steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pb-8">
              {[
                { step: '1', title: '分析标题', desc: '用 AI 优化你的标题和关键词', action: () => navigate('/analyze') },
                { step: '2', title: '记录数据', desc: '记录每条视频的播放和互动数据', action: () => navigate('/records') },
                { step: '3', title: 'AI 复盘', desc: '选择记录让 AI 分析成功规律', action: () => navigate('/records') },
              ].map(({ step, title, desc, action }) => (
                <button
                  key={step}
                  onClick={action}
                  className="text-left p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div className="text-xs font-bold text-primary mb-1">第 {step} 步</div>
                  <div className="text-sm font-semibold mb-0.5 group-hover:text-primary transition-colors">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
