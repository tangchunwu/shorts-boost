import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Lightbulb, Target, Zap, BookOpen } from 'lucide-react';

export interface CompetitorReport {
  summary: string;
  contentStrategy: string;
  strengths: string[];
  weaknesses: string[];
  learnFrom: string[];
  actionItems: string[];
  titlePatterns: string[];
}

export default function CompetitorAnalysisReport({ report }: { report: CompetitorReport }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm leading-relaxed">{report.summary}</p>
        </CardContent>
      </Card>

      {/* Content Strategy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> 内容策略差异
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.contentStrategy}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> 你的优势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-success font-medium shrink-0">✓</span>{s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> 需要改进
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-destructive font-medium shrink-0">!</span>{w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Learn From */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" /> 可借鉴策略
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.learnFrom.map((l, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-warning font-medium shrink-0">{i + 1}.</span>{l}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Title Patterns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> 竞品标题模式
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {report.titlePatterns.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> 立即行动
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.actionItems.map((a, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-accent font-bold shrink-0">→</span>{a}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
