import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Platform, PLATFORM_LABELS, PublishRecord } from '@/lib/types';
import { getRecords, saveRecord, deleteRecord } from '@/lib/storage';
import { exportToCSV, parseCSV } from '@/lib/csv';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Eye, ThumbsUp, MessageSquare, Share2, TrendingUp, TrendingDown, Sparkles, Loader2, Trophy, AlertTriangle, Lightbulb, Star, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useRef } from 'react';

interface ReviewResult {
  summary: string;
  topPatterns: string[];
  weakPoints: string[];
  actionItems: string[];
  bestTitle: string;
}

export default function Records() {
  const [records, setRecords] = useState<PublishRecord[]>(() => getRecords());
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '', platform: 'douyin' as Platform, publishedAt: new Date().toISOString().slice(0, 10),
    views: '', likes: '', comments: '', shares: '', tags: '',
  });

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { records: imported, errors } = parseCSV(text);
      if (imported.length === 0) {
        toast.error(errors[0] || '未找到有效数据');
        return;
      }
      imported.forEach(r => saveRecord(r));
      setRecords(getRecords());
      toast.success(`成功导入 ${imported.length} 条记录`);
      if (errors.length > 0) {
        toast.warning(`${errors.length} 条记录有问题`, { description: errors[0] });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setRecords(getRecords());
    toast.success('已删除');
  };

  const togglePerformance = (r: PublishRecord) => {
    const next = r.performance === 'high' ? 'low' : r.performance === 'low' ? 'normal' : 'high';
    saveRecord({ ...r, performance: next });
    setRecords(getRecords());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const handleReview = async () => {
    if (selectedIds.size < 2) {
      toast.error('请至少选择 2 条记录进行复盘');
      return;
    }
    setReviewing(true);
    setReviewResult(null);

    const selected = records.filter(r => selectedIds.has(r.id)).map(r => ({
      title: r.title,
      platform: PLATFORM_LABELS[r.platform],
      views: r.views,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
      tags: r.tags,
      performance: r.performance,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('review-records', {
        body: { records: selected },
      });

      if (error) throw new Error(error.message);
      if (data?.error) { toast.error(data.error); setReviewing(false); return; }

      setReviewResult(data as ReviewResult);
      toast.success('复盘分析完成！');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '复盘失败，请重试');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">发布记录</h1>
          <p className="text-muted-foreground text-sm mt-1">记录和复盘短视频表现</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
            <Upload className="h-3.5 w-3.5" /> 导入 CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          {records.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { exportToCSV(records); toast.success('已导出 CSV'); }} className="gap-1">
              <Download className="h-3.5 w-3.5" /> 导出
            </Button>
          )}
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
      </div>

      {/* Selection toolbar */}
      {records.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={selectAll}>
            {selectedIds.size === records.length ? '取消全选' : '全选'}
          </Button>
          <Button
            size="sm"
            disabled={selectedIds.size < 2 || reviewing}
            onClick={handleReview}
            className="gap-1.5"
            style={selectedIds.size >= 2 ? { backgroundImage: 'var(--gradient-accent)' } : undefined}
          >
            {reviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI 复盘分析 {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
          {selectedIds.size > 0 && selectedIds.size < 2 && (
            <span className="text-xs text-muted-foreground">至少选择 2 条记录</span>
          )}
        </div>
      )}

      {/* AI Review Result */}
      {reviewResult && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI 复盘分析报告
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comparison Charts */}
              {(() => {
                const selected = records.filter(r => selectedIds.has(r.id));
                const high = selected.filter(r => r.performance === 'high');
                const low = selected.filter(r => r.performance === 'low');
                const normal = selected.filter(r => r.performance !== 'high' && r.performance !== 'low');

                const avg = (arr: PublishRecord[], key: keyof Pick<PublishRecord, 'views' | 'likes' | 'comments' | 'shares'>) =>
                  arr.length ? Math.round(arr.reduce((s, r) => s + r[key], 0) / arr.length) : 0;

                const barData = [
                  { metric: '播放量', high: avg(high, 'views'), low: avg(low, 'views'), normal: avg(normal, 'views') },
                  { metric: '点赞', high: avg(high, 'likes'), low: avg(low, 'likes'), normal: avg(normal, 'likes') },
                  { metric: '评论', high: avg(high, 'comments'), low: avg(low, 'comments'), normal: avg(normal, 'comments') },
                  { metric: '分享', high: avg(high, 'shares'), low: avg(low, 'shares'), normal: avg(normal, 'shares') },
                ];

                const hasGroups = high.length > 0 || low.length > 0;

                // Radar data: normalize each metric to 0-100 scale
                const maxViews = Math.max(...selected.map(r => r.views), 1);
                const maxLikes = Math.max(...selected.map(r => r.likes), 1);
                const maxComments = Math.max(...selected.map(r => r.comments), 1);
                const maxShares = Math.max(...selected.map(r => r.shares), 1);

                const radarData = [
                  { metric: '播放量', high: Math.round(avg(high, 'views') / maxViews * 100), low: Math.round(avg(low, 'views') / maxViews * 100) },
                  { metric: '点赞', high: Math.round(avg(high, 'likes') / maxLikes * 100), low: Math.round(avg(low, 'likes') / maxLikes * 100) },
                  { metric: '评论', high: Math.round(avg(high, 'comments') / maxComments * 100), low: Math.round(avg(low, 'comments') / maxComments * 100) },
                  { metric: '分享', high: Math.round(avg(high, 'shares') / maxShares * 100), low: Math.round(avg(low, 'shares') / maxShares * 100) },
                ];

                // Per-record comparison bar chart
                const perRecordData = selected.map(r => ({
                  title: r.title.slice(0, 6) + (r.title.length > 6 ? '..' : ''),
                  views: r.views,
                  likes: r.likes,
                  fill: r.performance === 'high' ? 'hsl(152, 60%, 42%)' : r.performance === 'low' ? 'hsl(0, 84%, 60%)' : 'hsl(250, 75%, 58%)',
                }));

                return (
                  <>
                    {/* Per record views comparison */}
                    <div className="p-3 rounded-lg bg-card">
                      <p className="text-sm font-medium mb-2">📊 选中记录播放量对比</p>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={perRecordData}>
                            <XAxis dataKey="title" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                            <Tooltip />
                            <Bar dataKey="views" name="播放量" radius={[4, 4, 0, 0]}>
                              {perRecordData.map((entry, i) => (
                                <rect key={i} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" />高表现</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive inline-block" />低表现</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'hsl(250, 75%, 58%)' }} />普通</span>
                      </div>
                    </div>

                    {/* Grouped average comparison */}
                    {hasGroups && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-card">
                          <p className="text-sm font-medium mb-2">📈 高/低表现平均数据对比</p>
                          <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barData} barGap={2}>
                                <XAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                                <Tooltip />
                                {high.length > 0 && <Bar dataKey="high" name="高表现" fill="hsl(152, 60%, 42%)" radius={[3, 3, 0, 0]} />}
                                {low.length > 0 && <Bar dataKey="low" name="低表现" fill="hsl(0, 84%, 60%)" radius={[3, 3, 0, 0]} />}
                                {normal.length > 0 && <Bar dataKey="normal" name="普通" fill="hsl(250, 75%, 58%)" radius={[3, 3, 0, 0]} />}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {high.length > 0 && low.length > 0 && (
                          <div className="p-3 rounded-lg bg-card">
                            <p className="text-sm font-medium mb-2">🎯 雷达对比（归一化）</p>
                            <div className="h-44">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                  <PolarGrid stroke="hsl(220, 15%, 90%)" />
                                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                                  <PolarRadiusAxis tick={false} axisLine={false} />
                                  <Radar name="高表现" dataKey="high" stroke="hsl(152, 60%, 42%)" fill="hsl(152, 60%, 42%)" fillOpacity={0.25} />
                                  <Radar name="低表现" dataKey="low" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.25} />
                                  <Tooltip />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Summary */}
              <div className="p-3 rounded-lg bg-card">
                <p className="text-sm font-medium mb-1">📊 总体表现</p>
                <p className="text-sm text-muted-foreground">{reviewResult.summary}</p>
              </div>

              {/* Best title */}
              <div className="p-3 rounded-lg bg-card">
                <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-warning" /> 最佳标题
                </p>
                <p className="text-sm text-muted-foreground">{reviewResult.bestTitle}</p>
              </div>

              {/* Top patterns */}
              <div className="p-3 rounded-lg bg-card">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-success" /> 成功规律
                </p>
                <ul className="space-y-1.5">
                  {reviewResult.topPatterns.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-success shrink-0">✓</span>{p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weak points */}
              <div className="p-3 rounded-lg bg-card">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" /> 需要改进
                </p>
                <ul className="space-y-1.5">
                  {reviewResult.weakPoints.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-warning shrink-0">!</span>{p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action items */}
              <div className="p-3 rounded-lg bg-card">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" /> 行动建议
                </p>
                <ul className="space-y-1.5">
                  {reviewResult.actionItems.map((a, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          <Card key={r.id} className={`transition-all ${selectedIds.has(r.id) ? 'ring-2 ring-primary/40' : ''} ${r.performance === 'high' ? 'ring-1 ring-success/30' : r.performance === 'low' ? 'ring-1 ring-destructive/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(r.id)}
                  onCheckedChange={() => toggleSelect(r.id)}
                  className="mt-1 shrink-0"
                />
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
