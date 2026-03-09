import { useState, useMemo } from 'react';
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
import { Copy, Check, Loader2, Sparkles, Clock, Hash, Lightbulb, History, Eye, ChevronDown, ChevronUp, Search, CalendarPlus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';
import GuestPromptDialog from '@/components/GuestPromptDialog';
import { useGuest } from '@/contexts/GuestContext';
import TitleScoreCard from '@/components/TitleScoreCard';
import TitleTemplates from '@/components/TitleTemplates';

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

export default function Analyze() {
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
              <div className="space-y-2">
                <Label htmlFor="seo-title">视频标题</Label>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                  <Input id="seo-title" placeholder="输入视频标题..." value={title} onChange={e => setTitle(e.target.value)} className="text-base" />
                  <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PLATFORM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-script">脚本内容（可选）</Label>
                <Textarea id="seo-script" placeholder="粘贴视频脚本或描述内容..." value={script} onChange={e => setScript(e.target.value)} rows={4} />
              </div>
              <Button onClick={handleAnalyze} disabled={loading} className="w-full sm:w-auto" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'AI 分析中...' : '开始分析'}
              </Button>
            </CardContent>
          </Card>
          {result?.titleScore && <TitleScoreCard score={result.titleScore} className="card-hover animate-fade-in-up animate-stagger-1" />}
          {result && <ResultDisplay result={result} platform={platform} copied={copied} copyText={copyText} stagger />}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TitleTemplates platform={platform} onApply={(t) => { setTitle(t); setActiveTab('analyze'); }} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
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
