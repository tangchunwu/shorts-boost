import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Platform, PLATFORM_LABELS, SEOSuggestion, AnalysisHistory, CalendarEvent } from '@/lib/types';
import { useAnalyses, useSaveAnalysis, useSaveCalendarEvent } from '@/hooks/useCloudData';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Loader2, Sparkles, Clock, Hash, Lightbulb, History, Eye, ChevronDown, ChevronUp, Search, CalendarPlus, Wand2, Plus, Trash2, Share, BarChart3, Image } from 'lucide-react';
import AIProgressBar from '@/components/AIProgressBar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';
import GuestPromptDialog from '@/components/GuestPromptDialog';
import { useGuest } from '@/contexts/GuestContext';
import TitleScoreCard from '@/components/TitleScoreCard';
import TitleTemplates from '@/components/TitleTemplates';
import ComplianceCheckCard from '@/components/ComplianceCheckCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartTooltip from '@/components/ChartTooltip';

function AddToCalendarButton({ title, platform }: { title: string; platform: Platform }) {
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const saveEvent = useSaveCalendarEvent();

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    setDate(d);
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title,
      platform,
      date: format(d, 'yyyy-MM-dd'),
      status: 'planned',
    };
    saveEvent.mutate(event, {
      onSuccess: () => {
        toast.success('已添加到内容日历 📅');
        setOpen(false);
        setDate(undefined);
      },
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" title="加入日历">
          <CalendarPlus className="h-3.5 w-3.5 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function ResultDisplay({ result, platform, copied, copyText, stagger = false }: { result: SEOSuggestion; platform: Platform; copied: string | null; copyText: (text: string, label: string) => void; stagger?: boolean }) {
  const cards = [
    { icon: <Sparkles className="h-4 w-4 text-primary" />, title: '推荐标题', content: (
      <div className="space-y-2">
        {result.titles.map((t, i) => (
          <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-secondary/50 group hover:bg-secondary/80 transition-colors">
            <span className="text-sm flex-1">{t}</span>
            <div className="flex gap-0.5">
              <AddToCalendarButton title={t} platform={platform} />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(t, `title-${i}`)}>
                {copied === `title-${i}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )},
    { icon: <Hash className="h-4 w-4 text-primary" />, title: '推荐关键词/标签', content: (
      <>
        <div className="flex flex-wrap gap-2">
          {result.keywords.map((kw, i) => (
            <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => copyText(`#${kw}`, `kw-${i}`)}>
              #{kw}{copied === `kw-${i}` && <Check className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => copyText(result.keywords.map(k => `#${k}`).join(' '), 'all-kw')}>
          {copied === 'all-kw' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} 复制全部标签
        </Button>
      </>
    )},
    { icon: <Lightbulb className="h-4 w-4 text-primary" />, title: 'SEO 优化建议', content: (
      <ul className="space-y-2">{result.tips.map((tip, i) => <li key={i} className="text-sm flex gap-2"><span className="text-primary font-medium shrink-0">{i + 1}.</span>{tip}</li>)}</ul>
    )},
    { icon: <Clock className="h-4 w-4 text-primary" />, title: '最佳发布时间', content: <p className="text-sm">{result.bestPostTime}</p> },
  ];

  return (
    <div className="space-y-4">
      {cards.map((card, i) => (
        <Card key={i} className={`card-hover ${stagger ? `animate-fade-in-up animate-stagger-${i + 1}` : ''}`}>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">{card.icon} {card.title}</CardTitle></CardHeader>
          <CardContent>{card.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}

// Batch title input component
function BatchTitleInput({ titles, setTitles }: { titles: string[]; setTitles: (t: string[]) => void }) {
  const addTitle = () => {
    if (titles.length >= 5) { toast.error('最多 5 个标题'); return; }
    setTitles([...titles, '']);
  };
  const removeTitle = (idx: number) => setTitles(titles.filter((_, i) => i !== idx));
  const updateTitle = (idx: number, val: string) => {
    const copy = [...titles];
    copy[idx] = val;
    setTitles(copy);
  };

  return (
    <div className="space-y-2">
      {titles.map((t, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
          <Input placeholder={`标题 ${i + 1}`} value={t} onChange={e => updateTitle(i, e.target.value)} className="text-sm" />
          {titles.length > 1 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeTitle(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
      {titles.length < 5 && (
        <Button variant="ghost" size="sm" className="text-xs" onClick={addTitle}>
          <Plus className="h-3.5 w-3.5 mr-1" /> 添加标题（{titles.length}/5）
        </Button>
      )}
    </div>
  );
}

// Share card generator
function ShareCardButton({ result, title, platform }: { result: SEOSuggestion; title: string; platform: Platform }) {
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (!cardRef.current) return;
      cardRef.current.style.display = 'block';
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
      cardRef.current.style.display = 'none';
      const link = document.createElement('a');
      link.download = `seo-analysis-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('分析卡片已保存为图片 📸');
    } catch {
      toast.error('生成失败');
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleShare} disabled={generating} className="gap-1.5">
        {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
        保存为图片
      </Button>
      {/* Hidden share card */}
      <div ref={cardRef} style={{ display: 'none', position: 'fixed', left: '-9999px', width: '400px', padding: '24px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', borderRadius: '16px', fontFamily: 'system-ui' }}>
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>SEO 分析报告 · {PLATFORM_LABELS[platform]}</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>{title || '(无标题)'}</div>
        {result.titleScore && (
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4ade80', marginBottom: '4px' }}>{result.titleScore.overall}<span style={{ fontSize: '14px', color: '#888' }}>/100</span></div>
        )}
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>推荐标题</div>
        {result.titles.slice(0, 3).map((t, i) => (
          <div key={i} style={{ fontSize: '13px', padding: '6px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', marginBottom: '6px' }}>{t}</div>
        ))}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
          {result.keywords.slice(0, 6).map((kw, i) => (
            <span key={i} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>#{kw}</span>
          ))}
        </div>
        <div style={{ fontSize: '10px', color: '#666', marginTop: '16px', textAlign: 'right' }}>Powered by 短视频 SEO 助手</div>
      </div>
    </>
  );
}

export default function Analyze() {
  const location = useLocation();
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [platform, setPlatform] = useState<Platform>('douyin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOSuggestion | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { data: histories = [], isLoading: historiesLoading } = useAnalyses();
  const saveAnalysis = useSaveAnalysis();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('analyze');
  const { isGuest } = useGuest();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchTitles, setBatchTitles] = useState<string[]>(['', '']);
  const [batchResults, setBatchResults] = useState<{ title: string; score: number; result: SEOSuggestion }[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Receive topic from trending page
  useEffect(() => {
    const state = location.state as { title?: string; keywords?: string[] } | null;
    if (state?.title) {
      setTitle(state.title);
      setActiveTab('analyze');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAnalyze = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    if (!title.trim() && !script.trim()) { toast.error('请输入标题或脚本内容'); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-seo', {
        body: { title, script, platform: PLATFORM_LABELS[platform] },
      });
      if (error) throw new Error(error.message || '分析失败');
      if (data?.error) { toast.error(data.error); setLoading(false); return; }
      const seoResult: SEOSuggestion = { titles: data.titles || [], keywords: data.keywords || [], tips: data.tips || [], bestPostTime: data.bestPostTime || '', titleScore: data.titleScore || undefined };
      setResult(seoResult);
      const history: AnalysisHistory = { id: crypto.randomUUID(), inputTitle: title, inputScript: script, platform, suggestions: seoResult, createdAt: new Date().toISOString().slice(0, 10) };
      saveAnalysis.mutate(history);
      toast.success('分析完成！');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '分析失败，请重试');
    } finally { setLoading(false); }
  };

  const handleBatchAnalyze = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    const validTitles = batchTitles.filter(t => t.trim());
    if (validTitles.length < 2) { toast.error('请至少输入 2 个标题'); return; }
    setBatchLoading(true);
    setBatchResults([]);
    try {
      const results: { title: string; score: number; result: SEOSuggestion }[] = [];
      for (const t of validTitles) {
        const { data, error } = await supabase.functions.invoke('analyze-seo', {
          body: { title: t, script: '', platform: PLATFORM_LABELS[platform] },
        });
        if (error || data?.error) {
          results.push({ title: t, score: 0, result: { titles: [], keywords: [], tips: [], bestPostTime: '' } });
          continue;
        }
        const seoResult: SEOSuggestion = { titles: data.titles || [], keywords: data.keywords || [], tips: data.tips || [], bestPostTime: data.bestPostTime || '', titleScore: data.titleScore || undefined };
        results.push({ title: t, score: seoResult.titleScore?.overall || 0, result: seoResult });
        // Save each to history
        const history: AnalysisHistory = { id: crypto.randomUUID(), inputTitle: t, inputScript: '', platform, suggestions: seoResult, createdAt: new Date().toISOString().slice(0, 10) };
        saveAnalysis.mutate(history);
      }
      setBatchResults(results.sort((a, b) => b.score - a.score));
      toast.success(`已完成 ${validTitles.length} 个标题的批量分析！`);
    } catch (e) {
      toast.error('批量分析失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('已复制');
    setTimeout(() => setCopied(null), 2000);
  };

  const loadHistory = (h: AnalysisHistory) => {
    setTitle(h.inputTitle);
    setScript(h.inputScript);
    setPlatform(h.platform);
    setResult(h.suggestions);
    setActiveTab('analyze');
    setBatchMode(false);
    toast.success('已加载历史分析结果');
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else if (n.size < 3) n.add(id);
      else toast.error('最多对比 3 条记录');
      return n;
    });
  };

  const compareItems = useMemo(() => histories.filter(h => compareIds.has(h.id) && h.suggestions), [histories, compareIds]);

  // History score trend data
  const scoreTrendData = useMemo(() => {
    const withScores = histories
      .filter(h => h.suggestions?.titleScore?.overall)
      .reverse() // oldest first
      .slice(-20);
    return withScores.map(h => ({
      date: h.createdAt,
      score: h.suggestions!.titleScore!.overall,
      title: h.inputTitle?.slice(0, 10) || '...',
    }));
  }, [histories]);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold">SEO 分析</h1>
        <p className="text-muted-foreground text-sm mt-1">AI 智能优化标题、关键词和发布策略</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analyze" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> 新建分析</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" /> 标题灵感</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> 历史记录 ({histories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6 mt-4">
          <Card className="card-hover">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {batchMode ? '批量标题对比' : '视频标题'}
                </Label>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => { setBatchMode(!batchMode); setBatchResults([]); }}>
                  {batchMode ? <Sparkles className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
                  {batchMode ? '单标题模式' : '批量对比'}
                </Button>
              </div>

              {batchMode ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3 items-start">
                    <BatchTitleInput titles={batchTitles} setTitles={setBatchTitles} />
                    <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(PLATFORM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleBatchAnalyze} disabled={batchLoading} className="w-full sm:w-auto">
                    {batchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                    {batchLoading ? '批量分析中...' : `分析 ${batchTitles.filter(t => t.trim()).length} 个标题`}
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                    <Input id="seo-title" placeholder="输入视频标题..." value={title} onChange={e => setTitle(e.target.value)} className="text-base" />
                    <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(PLATFORM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo-script">脚本内容（可选）</Label>
                    <Textarea id="seo-script" placeholder="粘贴视频脚本或描述内容..." value={script} onChange={e => setScript(e.target.value)} rows={4} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAnalyze} disabled={loading} className="sm:w-auto">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {loading ? 'AI 分析中...' : '开始分析'}
                    </Button>
                    {result && <ShareCardButton result={result} title={title} platform={platform} />}
                  </div>
                  <AIProgressBar active={loading} steps={['正在连接 AI 服务...', '分析标题质量...', '生成关键词推荐...', '优化建议生成中...']} />
                </>
              )}
              {batchMode && <AIProgressBar active={batchLoading} steps={['正在批量提交...', '逐个分析标题...', '对比评分中...', '汇总结果...']} />}
            </CardContent>
          </Card>

          {/* Batch results */}
          {batchResults.length > 0 && (
            <Card className="animate-scale-in border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> 批量分析结果（按评分排序）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batchResults.map((item, i) => (
                    <div key={i} className={`p-3 rounded-lg transition-colors ${i === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/30'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {i === 0 && <Badge className="bg-primary text-primary-foreground text-xs">🏆 最佳</Badge>}
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        <span className={`text-lg font-bold ${item.score >= 80 ? 'text-success' : item.score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                          {item.score}<span className="text-xs text-muted-foreground">/100</span>
                        </span>
                      </div>
                      {item.result.titleScore && (
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>吸引力 {item.result.titleScore.dimensions.appeal}</span>
                          <span>关键词 {item.result.titleScore.dimensions.keywords}</span>
                          <span>适配度 {item.result.titleScore.dimensions.platformFit}</span>
                          <span>字数 {item.result.titleScore.dimensions.length}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!batchMode && result?.titleScore && <TitleScoreCard score={result.titleScore} className="card-hover animate-fade-in-up animate-stagger-1" />}
          {!batchMode && result && <ComplianceCheckCard title={title} keywords={result.keywords} platform={platform} className="card-hover animate-fade-in-up animate-stagger-2" />}
          {!batchMode && result && <ResultDisplay result={result} platform={platform} copied={copied} copyText={copyText} stagger />}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TitleTemplates platform={platform} onApply={(t) => { setTitle(t); setActiveTab('analyze'); setBatchMode(false); }} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {/* Score trend chart */}
          {scoreTrendData.length >= 2 && (
            <Card className="animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> 标题评分趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreTrendData}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground) / 0.3)" axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="score" name="评分" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {compareIds.size >= 2 && (
            <Card className="border-primary/20 bg-primary/5 animate-scale-in">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> 对比分析（{compareIds.size} 条）</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-24">项目</th>
                      {compareItems.map(h => <th key={h.id} className="text-left py-2 px-2 font-medium min-w-[200px]"><div className="truncate">{h.inputTitle || '(无标题)'}</div><div className="text-xs text-muted-foreground font-normal">{PLATFORM_LABELS[h.platform]} · {h.createdAt}</div></th>)}
                    </tr></thead>
                    <tbody>
                      <tr className="border-b border-border"><td className="py-2 pr-3 text-muted-foreground">评分</td>{compareItems.map(h => <td key={h.id} className="py-2 px-2"><span className="text-lg font-bold">{h.suggestions?.titleScore?.overall || '-'}</span></td>)}</tr>
                      <tr className="border-b border-border"><td className="py-2 pr-3 text-muted-foreground">推荐标题</td>{compareItems.map(h => <td key={h.id} className="py-2 px-2 align-top"><ul className="space-y-1">{h.suggestions?.titles.map((t, i) => <li key={i} className="text-xs leading-relaxed">{t}</li>)}</ul></td>)}</tr>
                      <tr className="border-b border-border"><td className="py-2 pr-3 text-muted-foreground">关键词</td>{compareItems.map(h => <td key={h.id} className="py-2 px-2 align-top"><div className="flex flex-wrap gap-1">{h.suggestions?.keywords.map((kw, i) => <Badge key={i} variant="secondary" className="text-xs">#{kw}</Badge>)}</div></td>)}</tr>
                      <tr className="border-b border-border"><td className="py-2 pr-3 text-muted-foreground">发布时间</td>{compareItems.map(h => <td key={h.id} className="py-2 px-2 text-xs">{h.suggestions?.bestPostTime}</td>)}</tr>
                      <tr><td className="py-2 pr-3 text-muted-foreground">建议</td>{compareItems.map(h => <td key={h.id} className="py-2 px-2 align-top"><ul className="space-y-1">{h.suggestions?.tips.map((tip, i) => <li key={i} className="text-xs">{i + 1}. {tip}</li>)}</ul></td>)}</tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          {compareIds.size > 0 && compareIds.size < 2 && <p className="text-xs text-muted-foreground">再选择 {2 - compareIds.size} 条记录即可对比</p>}

          {histories.length === 0 ? (
            <EmptyState icon={Search} title="还没有分析记录" description="去「新建分析」开始你的第一次 SEO 优化吧 ✨" actionLabel="新建分析" onAction={() => setActiveTab('analyze')} />
          ) : (
            <div className="space-y-3">
              {histories.map((h, i) => {
                const isExpanded = expandedId === h.id;
                return (
                  <Card key={h.id} className={`card-hover animate-fade-in-up animate-stagger-${Math.min(i + 1, 5)} ${compareIds.has(h.id) ? 'ring-2 ring-primary/40' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={compareIds.has(h.id)} onChange={() => toggleCompare(h.id)} className="mt-1.5 h-4 w-4 rounded border-input accent-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold truncate">{h.inputTitle || '(无标题)'}</h3>
                            <Badge variant="outline" className="shrink-0 text-xs">{PLATFORM_LABELS[h.platform]}</Badge>
                            {h.suggestions?.titleScore && (
                              <Badge variant="secondary" className={`text-xs ${h.suggestions.titleScore.overall >= 80 ? 'text-success' : h.suggestions.titleScore.overall >= 60 ? 'text-warning' : 'text-destructive'}`}>
                                {h.suggestions.titleScore.overall}分
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{h.createdAt}</p>
                          {h.inputScript && <p className="text-xs text-muted-foreground truncate">{h.inputScript.slice(0, 80)}...</p>}
                          {h.suggestions && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {h.suggestions.keywords.slice(0, 5).map((kw, i) => <Badge key={i} variant="secondary" className="text-xs">#{kw}</Badge>)}
                              {h.suggestions.keywords.length > 5 && <Badge variant="secondary" className="text-xs">+{h.suggestions.keywords.length - 5}</Badge>}
                            </div>
                          )}
                          {isExpanded && h.suggestions && <div className="mt-4 animate-fade-in"><ResultDisplay result={h.suggestions} platform={h.platform} copied={copied} copyText={copyText} /></div>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(isExpanded ? null : h.id)}>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadHistory(h)} title="加载到分析器">
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="AI 分析" />
    </div>
  );
}
