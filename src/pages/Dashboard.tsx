import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRecords, getAnalyses } from '@/lib/storage';
import { PLATFORM_LABELS, type PublishRecord } from '@/lib/types';
import { Search, FileText, TrendingUp, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const records = useMemo(() => getRecords(), []);
  const analyses = useMemo(() => getAnalyses(), []);

  const totalViews = records.reduce((s, r) => s + r.views, 0);
  const totalLikes = records.reduce((s, r) => s + r.likes, 0);
  const avgViews = records.length ? Math.round(totalViews / records.length) : 0;

  // Chart data: last 30 records by date
  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)).slice(-30);
    return sorted.map(r => ({
      date: r.publishedAt.slice(5, 10),
      views: r.views,
      likes: r.likes,
    }));
  }, [records]);

  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground text-sm mt-1">短视频数据概览与快速操作</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button onClick={() => navigate('/analyze')} className="h-auto py-4 justify-start gap-3" style={{ backgroundImage: 'var(--gradient-primary)' }}>
          <Search className="h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">新建 SEO 分析</div>
            <div className="text-xs opacity-80">AI 优化标题和关键词</div>
          </div>
        </Button>
        <Button onClick={() => navigate('/records')} variant="outline" className="h-auto py-4 justify-start gap-3">
          <FileText className="h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">添加发布记录</div>
            <div className="text-xs text-muted-foreground">记录和复盘视频表现</div>
          </div>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '总发布数', value: records.length, icon: FileText },
          { label: '总播放量', value: totalViews.toLocaleString(), icon: Eye },
          { label: '总点赞数', value: totalLikes.toLocaleString(), icon: ThumbsUp },
          { label: '平均播放', value: avgViews.toLocaleString(), icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <div className="text-xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">最近发布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg mb-2">还没有发布记录</p>
            <p className="text-sm">开始添加你的短视频数据，追踪增长趋势 🚀</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
