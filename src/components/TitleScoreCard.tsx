import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TitleScore } from '@/lib/types';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

interface TitleScoreCardProps {
  score: TitleScore;
  className?: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  appeal: '吸引力',
  keywords: '关键词',
  platformFit: '平台适配',
  length: '字数',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
}

function getScoreStroke(score: number): string {
  if (score >= 80) return 'hsl(var(--success))';
  if (score >= 60) return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

function getScoreLabel(score: number): { text: string; icon: React.ReactNode } {
  if (score >= 80) return { text: '优秀', icon: <Trophy className="h-4 w-4" /> };
  if (score >= 60) return { text: '良好', icon: <TrendingUp className="h-4 w-4" /> };
  return { text: '待改进', icon: <AlertCircle className="h-4 w-4" /> };
}

export default function TitleScoreCard({ score, className }: TitleScoreCardProps) {
  const radarData = Object.entries(score.dimensions).map(([key, value]) => ({
    dimension: DIMENSION_LABELS[key] || key,
    value,
    fullMark: 100,
  }));

  const { text: scoreLabel, icon } = getScoreLabel(score.overall);
  const scoreColor = getScoreColor(score.overall);
  const strokeColor = getScoreStroke(score.overall);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          标题评分
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <circle
                  stroke={strokeColor}
                  className="transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                  strokeDasharray={`${score.overall * 2.64} 264`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${scoreColor}`}>{score.overall}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-1.5 text-sm font-medium ${scoreColor}`}>
              {icon}
              {scoreLabel}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="flex-1 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="评分"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback */}
        {score.feedback && (
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
            💡 {score.feedback}
          </div>
        )}

        {/* Dimension breakdown */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {Object.entries(score.dimensions).map(([key, value]) => (
            <div key={key} className="text-center p-2 rounded-xl bg-secondary/50">
              <div className={`text-lg font-semibold ${getScoreColor(value)}`}>{value}</div>
              <div className="text-xs text-muted-foreground">{DIMENSION_LABELS[key]}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
