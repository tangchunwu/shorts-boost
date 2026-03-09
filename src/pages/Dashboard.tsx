import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLATFORM_LABELS, PLATFORM_COLORS, type PublishRecord, type Platform } from '@/lib/types';
import { Search, FileText, TrendingUp, Eye, ThumbsUp, MessageSquare, BarChart3, Share2, Percent, Download } from 'lucide-react';
import { useMemo, useState, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ChartTooltip from '@/components/ChartTooltip';
import EmptyState from '@/components/EmptyState';
import CompetitorCompare from '@/components/CompetitorCompare';
import AIInsightsCard, { type Insight } from '@/components/AIInsightsCard';
import PeriodicReportCard from '@/components/PeriodicReportCard';
import { useRecords } from '@/hooks/useCloudData';
import { exportDashboardPDF } from '@/lib/exportPDF';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import PageSkeleton from '@/components/PageSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深了 🌙';
  if (h < 12) return '早上好 ☀️';
  if (h < 14) return '中午好 🌤';
  if (h < 18) return '下午好 ☕';
  return '晚上好 🌆';
}

const ALL_PLATFORMS: ('all' | Platform)[] = ['all', 'douyin', 'kuaishou', 'xiaohongshu', 'bilibili'];

type TimeRange = '7d' | '30d' | 'all';
const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'all', label: '全部' },
];

function getDateThreshold(range: TimeRange): string | null {
  if (range === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - (range === '7d' ? 7 : 30));
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const navigate = useNavigate();
  useOnboarding();
  const { data: allRecords = [], isLoading } = useRecords();
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [exporting, setExporting] = useState(false);
  const pieChartsRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);

  const records = useMemo(() => {
    let filtered = allRecords;
    if (platformFilter !== 'all') filtered = filtered.filter(r => r.platform === platformFilter);
    const threshold = getDateThreshold(timeRange);
    if (threshold) filtered = filtered.filter(r => r.publishedAt >= threshold);
    return filtered;
  }, [allRecords, platformFilter, timeRange]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      await exportDashboardPDF({
        records,
        insights: aiInsights,
        platformFilter,
        timeRange,
        chartElements: {
          pieCharts: pieChartsRef.current,
          trendChart: trendChartRef.current,
        },
      });
      toast.success('PDF 报告已下载');
    } catch (e) {
      console.error('Export PDF error:', e);
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  }, [records, aiInsights, platformFilter, timeRange]);

  const totalViews = records.reduce((s, r) => s + r.views, 0);
  const totalLikes = records.reduce((s, r) => s + r.likes, 0);
  const totalComments = records.reduce((s, r) => s + r.comments, 0);
  const totalShares = records.reduce((s, r) => s + r.shares, 0);
  const avgViews = records.length ? Math.round(totalViews / records.length) : 0;

  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2) : '0.00';
  const likeRate = totalViews > 0 ? (totalLikes / totalViews * 100).toFixed(2) : '0.00';
  const commentRate = totalViews > 0 ? (totalComments / totalViews * 100).toFixed(2) : '0.00';
  const shareRate = totalViews > 0 ? (totalShares / totalViews * 100).toFixed(2) : '0.00';

  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)).slice(-30);
    return sorted.map(r => ({ date: r.publishedAt.slice(5, 10), views: r.views, likes: r.likes }));
  }, [records]);

  const recentRecords = records.slice(0, 5);

  const stats = [
    { label: '总发布数', value: records.length, icon: FileText, color: 'bg-primary/10 text-primary' },
    { label: '总播放量', value: totalViews.toLocaleString(), icon: Eye, color: 'bg-accent/10 text-accent' },
    { label: '总点赞数', value: totalLikes.toLocaleString(), icon: ThumbsUp, color: 'bg-success/10 text-success' },
    { label: '平均播放', value: avgViews.toLocaleString(), icon: TrendingUp, color: 'bg-warning/10 text-warning' },
  ];

  const derivedStats = [
    { label: '综合互动率', value: `${engagementRate}%`, icon: Percent, desc: '(赞+评+转)/播放' },
    { label: '点赞率', value: `${likeRate}%`, icon: ThumbsUp, desc: '点赞/播放' },
    { label: '评论率', value: `${commentRate}%`, icon: MessageSquare, desc: '评论/播放' },
    { label: '转发率', value: `${shareRate}%`, icon: Share2, desc: '分享/播放' },
  ];

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRecords.length };
    for (const r of allRecords) counts[r.platform] = (counts[r.platform] || 0) + 1;
    return counts;
  }, [allRecords]);

  const pieData = useMemo(() => {
    const map: Record<string, { views: number; likes: number }> = {};
    for (const r of allRecords) {
      if (!map[r.platform]) map[r.platform] = { views: 0, likes: 0 };
      map[r.platform].views += r.views;
      map[r.platform].likes += r.likes;
    }
    return Object.entries(map)
      .map(([platform, data]) => ({ name: PLATFORM_LABELS[platform as Platform], platform: platform as Platform, views: data.views, likes: data.likes }))
      .filter(d => d.views > 0)
      .sort((a, b) => b.views - a.views);
  }, [allRecords]);

  const PIE_COLORS = pieData.map(d => PLATFORM_COLORS[d.platform]);

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}{isGuest ? '，访客' : user?.email ? `，${user.email.split('@')[0]}` : ''}</h1>
          <p className="text-muted-foreground text-sm mt-1">短视频数据概览与快速操作</p>
        </div>
        {allRecords.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-2">
            <Download className={`h-4 w-4 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? '导出中...' : '导出报告'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button onClick={() => navigate('/analyze')} variant="secondary" className="h-auto py-5 justify-start gap-3 zen-card">
          <div className="rounded-lg bg-muted p-2"><Search className="h-5 w-5 text-foreground" /></div>
          <div className="text-left">
            <div className="font-semibold text-foreground">新建 SEO 分析</div>
            <div className="text-xs text-muted-foreground">AI 优化标题和关键词</div>
          </div>
        </Button>
        <Button onClick={() => navigate('/records')} variant="outline" className="h-auto py-5 justify-start gap-3 card-hover">
          <div className="rounded-lg bg-muted p-2"><FileText className="h-5 w-5 text-muted-foreground" /></div>
          <div className="text-left">
            <div className="font-semibold text-foreground">添加发布记录</div>
            <div className="text-xs text-muted-foreground">记录和复盘视频表现</div>
          </div>
        </Button>
      </div>

      {allRecords.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
          <div className="flex gap-1 bg-secondary/60 rounded-xl p-1">
            {TIME_RANGES.map(({ value, label }) => (
              <button key={value} onClick={() => setTimeRange(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${timeRange === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map(p => {
              const isActive = platformFilter === p;
              const count = platformCounts[p] || 0;
              if (p !== 'all' && count === 0) return null;
              return (
                <button key={p} onClick={() => setPlatformFilter(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-250 border ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                  style={undefined}>
                  {p !== 'all' && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isActive ? 'hsl(0, 0%, 100%)' : PLATFORM_COLORS[p as Platform] }} />}
                  {p === 'all' ? '全部' : PLATFORM_LABELS[p as Platform]}
                  <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`rounded-lg p-1.5 ${color}`}><Icon className="h-3.5 w-3.5" /></div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className="text-xl font-bold num-pop">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {records.length > 0 && (
        <Card className="animate-fade-in-up animate-stagger-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> 互动率指标</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {derivedStats.map(({ label, value, icon: Icon, desc }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center justify-center gap-1.5 mb-1"><Icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{label}</span></div>
                  <div className="text-lg font-bold text-foreground">{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pieData.length > 0 && (
        <div ref={pieChartsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          <Card className="card-hover">
            <CardHeader className="pb-2"><CardTitle className="text-base">📊 播放量平台分布</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} strokeWidth={0} animationBegin={0} animationDuration={800}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2"><CardTitle className="text-base">👍 点赞数平台分布</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="likes" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} strokeWidth={0} animationBegin={200} animationDuration={800}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartData.length > 1 && (
        <Card className="animate-fade-in-up">
          <CardHeader className="pb-2"><CardTitle className="text-base">播放量趋势</CardTitle></CardHeader>
          <CardContent>
            <div ref={trendChartRef} className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                   <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground) / 0.15)' }} />
                  <Area type="monotone" dataKey="views" name="播放量" stroke="hsl(var(--foreground))" fill="url(#viewsGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }} animationDuration={1000} />
                  <Area type="monotone" dataKey="likes" name="点赞数" stroke="hsl(var(--success))" fill="url(#likesGrad)" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--card))' }} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {recentRecords.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardHeader className="pb-2"><CardTitle className="text-base">最近发布</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 transition-colors hover:bg-secondary/30 rounded px-2 -mx-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[r.platform] }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[r.platform]} · {r.publishedAt}</p>
                  </div>
                </div>
                <div className="text-sm font-medium text-right shrink-0 ml-4">{r.views.toLocaleString()} 播放</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {allRecords.length > 0 && <AIInsightsCard records={allRecords} onInsightsChange={setAiInsights} />}

      <CompetitorCompare />

      {allRecords.length > 0 && <PeriodicReportCard records={allRecords} />}

      {allRecords.length === 0 && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-0">
            <EmptyState icon={BarChart3} title="还没有发布记录" description="开始添加你的短视频数据，追踪增长趋势 🚀" actionLabel="添加第一条记录" onAction={() => navigate('/records')} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pb-8">
              {[
                { step: '1', title: '分析标题', desc: '用 AI 优化你的标题和关键词', action: () => navigate('/analyze') },
                { step: '2', title: '记录数据', desc: '记录每条视频的播放和互动数据', action: () => navigate('/records') },
                { step: '3', title: 'AI 复盘', desc: '选择记录让 AI 分析成功规律', action: () => navigate('/records') },
              ].map(({ step, title, desc, action }) => (
                <button key={step} onClick={action} className="text-left p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 hover:-translate-y-0.5 group">
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
