import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Platform, PLATFORM_LABELS } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Loader2, TrendingUp, TrendingDown, Minus, ArrowRight, Lightbulb, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import GuestPromptDialog from '@/components/GuestPromptDialog';
import { useGuest } from '@/contexts/GuestContext';

interface HotTopic {
  title: string;
  heat: number;
  trend: 'rising' | 'stable' | 'declining';
  description: string;
  relatedKeywords: string[];
}

interface TrendingData {
  hotTopics: HotTopic[];
  trendInsight: string;
}

const CATEGORIES = [
  { value: '综合', label: '综合' },
  { value: '生活', label: '生活' },
  { value: '美食', label: '美食' },
  { value: '美妆', label: '美妆' },
  { value: '科技', label: '科技' },
  { value: '教育', label: '教育' },
  { value: '娱乐', label: '娱乐' },
  { value: '健身', label: '健身' },
];

const TREND_CONFIG = {
  rising: { icon: TrendingUp, color: 'text-green-500', label: '上升' },
  stable: { icon: Minus, color: 'text-yellow-500', label: '稳定' },
  declining: { icon: TrendingDown, color: 'text-red-500', label: '下降' },
};

function HeatBar({ heat }: { heat: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${heat}%`,
            background: heat >= 80 ? 'hsl(var(--destructive))' : heat >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
          }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{heat}</span>
    </div>
  );
}

export default function TrendingTopics() {
  const [platform, setPlatform] = useState<Platform>('douyin');
  const [category, setCategory] = useState('综合');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrendingData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isGuest } = useGuest();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const handleFetch = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    setLoading(true);
    setData(null);
    try {
      const { data: result, error } = await supabase.functions.invoke('trending-topics', {
        body: { platform: PLATFORM_LABELS[platform], category },
      });
      if (error) throw new Error(error.message);
      if (result?.error) { toast.error(result.error); setLoading(false); return; }
      setData(result);
      toast.success('热门话题已更新');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '获取失败');
    } finally { setLoading(false); }
  };

  const handleUseInAnalyzer = (topic: HotTopic) => {
    // Navigate to analyze page with the topic as title
    navigate('/analyze', { state: { title: topic.title, keywords: topic.relatedKeywords } });
    toast.success('已填入 SEO 分析器');
  };

  const handleCopyKeywords = (keywords: string[], id: string) => {
    navigator.clipboard.writeText(keywords.map(k => `#${k}`).join(' '));
    setCopied(id);
    toast.success('关键词已复制');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold">热门话题</h1>
        <p className="text-muted-foreground text-sm mt-1">AI 分析各平台热门趋势，助你抢占流量风口</p>
      </div>

      <Card className="card-hover">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">目标平台</label>
              <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">内容分类</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFetch} disabled={loading} className="btn-primary-glow text-primary-foreground rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Flame className="h-4 w-4 mr-1" />}
              {loading ? '分析中...' : '获取热门话题'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-4 animate-fade-in">
          {/* Trend Insight */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">趋势洞察</p>
                <p className="text-sm text-muted-foreground">{data.trendInsight}</p>
              </div>
            </CardContent>
          </Card>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.hotTopics.map((topic, i) => {
              const trendCfg = TREND_CONFIG[topic.trend];
              const TrendIcon = trendCfg.icon;
              return (
                <Card key={i} className={`card-hover animate-fade-in-up animate-stagger-${Math.min(i + 1, 5)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground/40">#{i + 1}</span>
                        <h3 className="text-sm font-semibold">{topic.title}</h3>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${trendCfg.color}`}>
                        <TrendIcon className="h-3 w-3" />
                        {trendCfg.label}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{topic.description}</p>
                    <HeatBar heat={topic.heat} />
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {topic.relatedKeywords.map((kw, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">#{kw}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleUseInAnalyzer(topic)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" /> 用于 SEO 分析
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleCopyKeywords(topic.relatedKeywords, `topic-${i}`)}
                      >
                        {copied === `topic-${i}` ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        复制关键词
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💡 话题数据基于 AI 趋势分析生成，供创作参考
          </p>
        </div>
      )}
      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="热门话题" />
    </div>
  );
}
