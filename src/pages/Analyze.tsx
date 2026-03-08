import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Platform, PLATFORM_LABELS, SEOSuggestion, AnalysisHistory } from '@/lib/types';
import { saveAnalysis } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { Search, Copy, Check, Loader2, Sparkles, Clock, Hash, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function Analyze() {
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [platform, setPlatform] = useState<Platform>('douyin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOSuggestion | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim() && !script.trim()) {
      toast.error('请输入标题或脚本内容');
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-seo', {
        body: { title, script, platform: PLATFORM_LABELS[platform] },
      });

      if (error) {
        throw new Error(error.message || '分析失败');
      }

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      const seoResult: SEOSuggestion = {
        titles: data.titles || [],
        keywords: data.keywords || [],
        tips: data.tips || [],
        bestPostTime: data.bestPostTime || '',
      };

      setResult(seoResult);

      const history: AnalysisHistory = {
        id: crypto.randomUUID(),
        inputTitle: title,
        inputScript: script,
        platform,
        suggestions: seoResult,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      saveAnalysis(history);
      toast.success('分析完成！');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('已复制');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SEO 分析</h1>
        <p className="text-muted-foreground text-sm mt-1">AI 智能优化标题、关键词和发布策略</p>
      </div>

      {/* Input */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
            <Input
              placeholder="输入视频标题..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-base"
            />
            <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="粘贴视频脚本或描述内容（可选）..."
            value={script}
            onChange={e => setScript(e.target.value)}
            rows={4}
          />
          <Button onClick={handleAnalyze} disabled={loading} className="w-full sm:w-auto" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'AI 分析中...' : '开始分析'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Titles */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                推荐标题
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.titles.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-secondary/50 group">
                  <span className="text-sm flex-1">{t}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyText(t, `title-${i}`)}
                  >
                    {copied === `title-${i}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                推荐关键词/标签
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => copyText(`#${kw}`, `kw-${i}`)}
                  >
                    #{kw}
                    {copied === `kw-${i}` && <Check className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => copyText(result.keywords.map(k => `#${k}`).join(' '), 'all-kw')}
              >
                {copied === 'all-kw' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                复制全部标签
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                SEO 优化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Best time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                最佳发布时间
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{result.bestPostTime}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
