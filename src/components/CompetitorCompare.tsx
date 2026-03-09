import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Platform, PLATFORM_LABELS } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Swords, Plus, X, Check, Copy, ThumbsUp, ThumbsDown, Sparkles, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useGuest } from '@/contexts/GuestContext';
import GuestPromptDialog from '@/components/GuestPromptDialog';

interface CompetitorScore {
  title: string;
  score: number;
  highlight: string;
}

interface CompareResult {
  myTitleScore: number;
  competitorScores: CompetitorScore[];
  strengths: string[];
  weaknesses: string[];
  improvedTitles: string[];
  summary: string;
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 75 ? 'hsl(var(--primary))' : score >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="absolute text-xs font-bold">{score}</span>
    </div>
  );
}

export default function CompetitorCompare() {
  const [myTitle, setMyTitle] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [platform, setPlatform] = useState<Platform>('douyin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { isGuest } = useGuest();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const addCompetitor = () => {
    if (competitors.length < 5) setCompetitors([...competitors, '']);
  };

  const removeCompetitor = (i: number) => {
    if (competitors.length > 1) setCompetitors(competitors.filter((_, idx) => idx !== i));
  };

  const updateCompetitor = (i: number, v: string) => {
    const next = [...competitors];
    next[i] = v;
    setCompetitors(next);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('已复制');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCompare = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    if (!myTitle.trim()) { toast.error('请输入你的标题'); return; }
    const validCompetitors = competitors.filter(c => c.trim());
    if (validCompetitors.length === 0) { toast.error('请至少输入一个竞品标题'); return; }

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('compare-titles', {
        body: { myTitle, competitorTitles: validCompetitors, platform: PLATFORM_LABELS[platform] },
      });
      if (error) throw new Error(error.message || '对比失败');
      if (data?.error) { toast.error(data.error); setLoading(false); return; }
      setResult(data as CompareResult);
      toast.success('对比分析完成！');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '对比失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-hover animate-fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" /> 竞品标题对比
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">我的标题</Label>
            <Input placeholder="输入你的视频标题..." value={myTitle} onChange={e => setMyTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">平台</Label>
            <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(PLATFORM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">竞品标题</Label>
          {competitors.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder={`竞品标题 ${i + 1}...`} value={c} onChange={e => updateCompetitor(i, e.target.value)} />
              {competitors.length > 1 && (
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => removeCompetitor(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
          {competitors.length < 5 && (
            <Button variant="outline" size="sm" onClick={addCompetitor} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> 添加竞品
            </Button>
          )}
        </div>

        <Button onClick={handleCompare} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
          {loading ? 'AI 分析中...' : '开始对比'}
        </Button>

        {result && (
          <div className="space-y-4 mt-2 animate-fade-in">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <Trophy className="h-4 w-4 text-primary inline mr-1.5" />{result.summary}
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <ScoreRing score={result.myTitleScore} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">我的标题</p>
                  <p className="text-sm font-medium truncate">{myTitle}</p>
                </div>
              </div>
              {result.competitorScores.map((cs, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <ScoreRing score={cs.score} />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">竞品 {i + 1}</p>
                    <p className="text-sm font-medium truncate">{cs.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{cs.highlight}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/40 space-y-1.5">
                <p className="text-xs font-medium flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5 text-primary" /> 优势</p>
                {result.strengths.map((s, i) => <p key={i} className="text-sm text-muted-foreground">• {s}</p>)}
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 space-y-1.5">
                <p className="text-xs font-medium flex items-center gap-1"><ThumbsDown className="h-3.5 w-3.5 text-destructive" /> 不足</p>
                {result.weaknesses.map((w, i) => <p key={i} className="text-sm text-muted-foreground">• {w}</p>)}
              </div>
            </div>

            {/* Improved Titles */}
            <div className="space-y-2">
              <p className="text-xs font-medium flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> 改进标题建议</p>
              {result.improvedTitles.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-secondary/50 group hover:bg-secondary/80 transition-colors">
                  <span className="text-sm flex-1">{t}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(t, `imp-${i}`)}>
                    {copied === `imp-${i}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="竞品对比" />
    </Card>
  );
}
