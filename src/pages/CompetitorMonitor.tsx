import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Platform, PLATFORM_LABELS, PLATFORM_COLORS } from '@/lib/types';
import { useRecords } from '@/hooks/useCloudData';
import { useCompetitorVideos, useSaveCompetitorVideo, useDeleteCompetitorVideo } from '@/hooks/useCompetitorData';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Trash2, BarChart3, Eye, ThumbsUp, MessageSquare, Share2, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/EmptyState';
import PageSkeleton from '@/components/PageSkeleton';
import GuestPromptDialog from '@/components/GuestPromptDialog';
import CompetitorAnalysisReport, { type CompetitorReport } from '@/components/CompetitorAnalysisReport';
import { useGuest } from '@/contexts/GuestContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartTooltip from '@/components/ChartTooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CompetitorMonitor() {
  const { data: competitors = [], isLoading } = useCompetitorVideos();
  const saveVideo = useSaveCompetitorVideo();
  const deleteVideo = useDeleteCompetitorVideo();
  const { data: myRecords = [] } = useRecords();
  const { isGuest } = useGuest();

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Form state
  const [accountName, setAccountName] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('douyin');
  const [publishedAt, setPublishedAt] = useState('');
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');

  // Comparison stats
  const comparison = useMemo(() => {
    if (competitors.length === 0 || myRecords.length === 0) return null;
    const myAvgViews = Math.round(myRecords.reduce((s, r) => s + r.views, 0) / myRecords.length);
    const myAvgLikes = Math.round(myRecords.reduce((s, r) => s + r.likes, 0) / myRecords.length);
    const compAvgViews = Math.round(competitors.reduce((s, c) => s + c.views, 0) / competitors.length);
    const compAvgLikes = Math.round(competitors.reduce((s, c) => s + c.likes, 0) / competitors.length);
    return { myAvgViews, myAvgLikes, compAvgViews, compAvgLikes };
  }, [competitors, myRecords]);

  // Group by account
  const accountGroups = useMemo(() => {
    const groups: Record<string, typeof competitors> = {};
    for (const c of competitors) {
      if (!groups[c.accountName]) groups[c.accountName] = [];
      groups[c.accountName].push(c);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [competitors]);

  // Trend chart data
  const trendData = useMemo(() => {
    if (competitors.length === 0) return [];
    const sorted = [...competitors].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    return sorted.map(c => ({
      date: c.publishedAt.slice(5, 10),
      views: c.views,
      likes: c.likes,
      account: c.accountName,
    }));
  }, [competitors]);

  if (isLoading) return <PageSkeleton variant="list" />;
  const handleAdd = () => {
    if (!accountName.trim() || !title.trim()) { toast.error('请填写账号名和视频标题'); return; }
    const video = {
      id: crypto.randomUUID(),
      accountName: accountName.trim(),
      title: title.trim(),
      platform,
      publishedAt: publishedAt || new Date().toISOString().slice(0, 10),
      views: Math.max(0, parseInt(views) || 0),
      likes: Math.max(0, parseInt(likes) || 0),
      comments: Math.max(0, parseInt(comments) || 0),
      shares: Math.max(0, parseInt(shares) || 0),
      createdAt: new Date().toISOString(),
    };
    saveVideo.mutate(video, {
      onSuccess: () => { setShowForm(false); resetForm(); toast.success('竞品视频已添加'); },
      onError: () => toast.error('添加失败'),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteVideo.mutate(deleteId, {
      onSuccess: () => { setDeleteId(null); toast.success('已删除'); },
    });
  };

  const resetForm = () => {
    setAccountName(''); setTitle(''); setPlatform('douyin');
    setPublishedAt(''); setViews(''); setLikes(''); setComments(''); setShares('');
  };

  const handleAIAnalysis = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    if (competitors.length === 0) { toast.error('请先添加竞品视频数据'); return; }
    if (myRecords.length === 0) { toast.error('请先添加自己的发布记录'); return; }
    setAnalyzing(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-competitors', {
        body: {
          competitorVideos: competitors.slice(0, 20).map(c => ({
            accountName: c.accountName, title: c.title, platform: PLATFORM_LABELS[c.platform],
            views: c.views, likes: c.likes, comments: c.comments, shares: c.shares,
          })),
          myRecords: myRecords.slice(0, 20).map(r => ({
            title: r.title, platform: PLATFORM_LABELS[r.platform],
            views: r.views, likes: r.likes, comments: r.comments, shares: r.shares,
          })),
        },
      });
      if (error) throw new Error(error.message || '分析失败');
      if (data?.error) { toast.error(data.error); return; }
      setReport(data as CompetitorReport);
      setActiveTab('report');
      toast.success('AI 竞品分析完成！');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '分析失败');
    } finally {
      setAnalyzing(false);
    }
  };


  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">竞品监控</h1>
          <p className="text-muted-foreground text-sm mt-1">记录竞品视频数据，AI 对比分析差距</p>
        </div>
        <div className="flex gap-2">
          {competitors.length > 0 && myRecords.length > 0 && (
            <Button onClick={handleAIAnalysis} disabled={analyzing} variant="outline" size="sm">
              {analyzing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {analyzing ? 'AI 分析中...' : 'AI 竞品分析'}
            </Button>
          )}
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> 添加竞品
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="animate-scale-in">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>竞品账号名</Label>
                <Input placeholder="如：张三说事" value={accountName} onChange={e => setAccountName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>视频标题</Label>
                <Input placeholder="视频标题" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>平台</Label>
                <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>发布日期</Label>
                <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>播放量</Label>
                <Input type="number" min="0" placeholder="0" value={views} onChange={e => setViews(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>点赞数</Label>
                <Input type="number" min="0" placeholder="0" value={likes} onChange={e => setLikes(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>评论数</Label>
                <Input type="number" min="0" placeholder="0" value={comments} onChange={e => setComments(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>分享数</Label>
                <Input type="number" min="0" placeholder="0" value={shares} onChange={e => setShares(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saveVideo.isPending}>
                {saveVideo.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                添加
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5"><Users className="h-3.5 w-3.5" /> 竞品列表</TabsTrigger>
          <TabsTrigger value="trend" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> 趋势图</TabsTrigger>
          {report && <TabsTrigger value="report" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI 报告</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          {/* Comparison Card */}
          {comparison && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> 我的 vs 竞品 对比
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">平均播放量</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold">{comparison.myAvgViews.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">我的</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-primary">{comparison.compAvgViews.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">竞品</span>
                    </div>
                    {comparison.myAvgViews < comparison.compAvgViews ? (
                      <p className="text-xs text-destructive mt-1">差距 {((comparison.compAvgViews - comparison.myAvgViews) / comparison.compAvgViews * 100).toFixed(0)}%</p>
                    ) : (
                      <p className="text-xs text-success mt-1">领先 {((comparison.myAvgViews - comparison.compAvgViews) / comparison.myAvgViews * 100).toFixed(0)}%</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">平均点赞数</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold">{comparison.myAvgLikes.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">我的</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-primary">{comparison.compAvgLikes.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">竞品</span>
                    </div>
                    {comparison.myAvgLikes < comparison.compAvgLikes ? (
                      <p className="text-xs text-destructive mt-1">差距 {((comparison.compAvgLikes - comparison.myAvgLikes) / comparison.compAvgLikes * 100).toFixed(0)}%</p>
                    ) : (
                      <p className="text-xs text-success mt-1">领先 {((comparison.myAvgLikes - comparison.compAvgLikes) / comparison.myAvgLikes * 100).toFixed(0)}%</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitor list */}
          {competitors.length === 0 ? (
            <EmptyState
              icon={Users}
              title="还没有竞品记录"
              description="添加竞品视频数据，AI 对比分析与自己的差距 🔍"
              actionLabel="添加竞品视频"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="space-y-4">
              {accountGroups.map(([name, videos]) => (
                <Card key={name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {name}
                      <Badge variant="secondary" className="text-xs">{videos.length} 条</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {videos.map(video => (
                        <div key={video.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 group hover:bg-secondary/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium truncate">{video.title}</span>
                              <Badge variant="outline" className="text-xs shrink-0">{PLATFORM_LABELS[video.platform]}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span>{video.publishedAt}</span>
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{video.views.toLocaleString()}</span>
                              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{video.likes.toLocaleString()}</span>
                              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{video.comments.toLocaleString()}</span>
                              <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{video.shares.toLocaleString()}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(video.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          {trendData.length < 2 ? (
            <EmptyState icon={TrendingUp} title="数据不足" description="至少需要 2 条竞品记录才能显示趋势图" />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">竞品数据趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="views" name="播放量" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="likes" name="点赞数" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {report && (
          <TabsContent value="report" className="mt-4">
            <CompetitorAnalysisReport report={report} />
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>删除后无法恢复，确定要删除这条竞品记录吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="AI 竞品分析" />
    </div>
  );
}
