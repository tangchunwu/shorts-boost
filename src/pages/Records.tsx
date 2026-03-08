import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Platform, PLATFORM_LABELS, PublishRecord } from '@/lib/types';
import { getRecords, saveRecord, deleteRecord } from '@/lib/storage';
import { Plus, Trash2, Eye, ThumbsUp, MessageSquare, Share2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Records() {
  const [records, setRecords] = useState<PublishRecord[]>(() => getRecords());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', platform: 'douyin' as Platform, publishedAt: new Date().toISOString().slice(0, 10),
    views: '', likes: '', comments: '', shares: '', tags: '',
  });

  const chartData = useMemo(() => {
    return [...records].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)).slice(-20).map(r => ({
      title: r.title.slice(0, 8) + (r.title.length > 8 ? '...' : ''),
      views: r.views, likes: r.likes,
    }));
  }, [records]);

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('请输入标题'); return; }
    const record: PublishRecord = {
      id: crypto.randomUUID(),
      title: form.title,
      platform: form.platform,
      publishedAt: form.publishedAt,
      views: parseInt(form.views) || 0,
      likes: parseInt(form.likes) || 0,
      comments: parseInt(form.comments) || 0,
      shares: parseInt(form.shares) || 0,
      tags: form.tags.split(/[,，\s]+/).filter(Boolean),
      performance: 'normal',
      createdAt: new Date().toISOString(),
    };
    saveRecord(record);
    setRecords(getRecords());
    setForm({ title: '', platform: 'douyin', publishedAt: new Date().toISOString().slice(0, 10), views: '', likes: '', comments: '', shares: '', tags: '' });
    setOpen(false);
    toast.success('发布记录已添加');
  };

  const handleDelete = (id: string) => {
    deleteRecord(id);
    setRecords(getRecords());
    toast.success('已删除');
  };

  const togglePerformance = (r: PublishRecord) => {
    const next = r.performance === 'high' ? 'low' : r.performance === 'low' ? 'normal' : 'high';
    saveRecord({ ...r, performance: next });
    setRecords(getRecords());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">发布记录</h1>
          <p className="text-muted-foreground text-sm mt-1">记录和复盘短视频表现</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundImage: 'var(--gradient-primary)' }}>
              <Plus className="h-4 w-4 mr-1" /> 添加记录
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加发布记录</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="视频标题" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as Platform }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="播放量" type="number" value={form.views} onChange={e => setForm(f => ({ ...f, views: e.target.value }))} />
                <Input placeholder="点赞数" type="number" value={form.likes} onChange={e => setForm(f => ({ ...f, likes: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="评论数" type="number" value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} />
                <Input placeholder="分享数" type="number" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} />
              </div>
              <Input placeholder="标签（逗号分隔）" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              <Button onClick={handleSubmit} className="w-full">保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">播放量对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(250, 75%, 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records list */}
      <div className="space-y-3">
        {records.map(r => (
          <Card key={r.id} className={r.performance === 'high' ? 'ring-1 ring-success/30' : r.performance === 'low' ? 'ring-1 ring-destructive/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">{r.title}</h3>
                    <Badge variant="outline" className="shrink-0 text-xs">{PLATFORM_LABELS[r.platform]}</Badge>
                    {r.performance === 'high' && <Badge className="bg-success/10 text-success text-xs"><TrendingUp className="h-3 w-3 mr-0.5" />高表现</Badge>}
                    {r.performance === 'low' && <Badge className="bg-destructive/10 text-destructive text-xs"><TrendingDown className="h-3 w-3 mr-0.5" />低表现</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{r.publishedAt}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{r.views.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{r.likes.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{r.comments.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{r.shares.toLocaleString()}</span>
                  </div>
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">#{t}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePerformance(r)}>
                    {r.performance === 'high' ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {records.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>还没有发布记录，点击「添加记录」开始追踪数据 📊</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
