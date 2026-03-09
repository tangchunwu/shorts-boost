import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Platform, PLATFORM_LABELS } from '@/lib/types';
import { useRecords } from '@/hooks/useCloudData';
import { Users, Plus, Trash2, BarChart3, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/EmptyState';
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

interface CompetitorVideo {
  id: string;
  accountName: string;
  title: string;
  platform: Platform;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
}

const STORAGE_KEY = 'competitor_videos';

function loadCompetitors(): CompetitorVideo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCompetitors(data: CompetitorVideo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function CompetitorMonitor() {
  const [competitors, setCompetitors] = useState<CompetitorVideo[]>(loadCompetitors);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: myRecords = [] } = useRecords();

  // Form state
  const [accountName, setAccountName] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('douyin');
  const [publishedAt, setPublishedAt] = useState('');
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');

  const handleAdd = () => {
    if (!accountName.trim() || !title.trim()) { toast.error('请填写账号名和视频标题'); return; }
    const video: CompetitorVideo = {
      id: crypto.randomUUID(),
      accountName: accountName.trim(),
      title: title.trim(),
      platform,
      publishedAt: publishedAt || new Date().toISOString().slice(0, 10),
      views: Math.max(0, parseInt(views) || 0),
      likes: Math.max(0, parseInt(likes) || 0),
      comments: Math.max(0, parseInt(comments) || 0),
    };
    const updated = [video, ...competitors];
    setCompetitors(updated);
    saveCompetitors(updated);
    setShowForm(false);
    resetForm();
    toast.success('竞品视频已添加');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = competitors.filter(c => c.id !== deleteId);
    setCompetitors(updated);
    saveCompetitors(updated);
    setDeleteId(null);
    toast.success('已删除');
  };

  const resetForm = () => {
    setAccountName(''); setTitle(''); setPlatform('douyin');
    setPublishedAt(''); setViews(''); setLikes(''); setComments('');
  };

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
    const groups: Record<string, CompetitorVideo[]> = {};
    for (const c of competitors) {
      if (!groups[c.accountName]) groups[c.accountName] = [];
      groups[c.accountName].push(c);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [competitors]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">竞品监控</h1>
          <p className="text-muted-foreground text-sm mt-1">记录竞品视频数据，对比分析差距</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="btn-primary-glow text-primary-foreground rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> 添加竞品视频
        </Button>
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
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>添加</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <p className="text-xs text-red-500 mt-1">差距 {((comparison.compAvgViews - comparison.myAvgViews) / comparison.compAvgViews * 100).toFixed(0)}%</p>
                ) : (
                  <p className="text-xs text-green-500 mt-1">领先 {((comparison.myAvgViews - comparison.compAvgViews) / comparison.myAvgViews * 100).toFixed(0)}%</p>
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
                  <p className="text-xs text-red-500 mt-1">差距 {((comparison.compAvgLikes - comparison.myAvgLikes) / comparison.compAvgLikes * 100).toFixed(0)}%</p>
                ) : (
                  <p className="text-xs text-green-500 mt-1">领先 {((comparison.myAvgLikes - comparison.compAvgLikes) / comparison.myAvgLikes * 100).toFixed(0)}%</p>
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
          description="添加竞品视频数据，对比分析与自己的差距 🔍"
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
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{video.publishedAt}</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{video.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{video.likes.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{video.comments.toLocaleString()}</span>
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
    </div>
  );
}
