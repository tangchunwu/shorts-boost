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
  if (score >= 80) return { text: '优秀', icon: <Trophy className="h-4 w-4" strokeWidth={1.5} /> };
  if (score >= 60) return { text: '良好', icon: <TrendingUp className="h-4 w-4" strokeWidth={1.5} /> };
  return { text: '待改进', icon: <AlertCircle className="h-4 w-4" strokeWidth={1.5} /> };
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-input" style={{ boxShadow: 'var(--shadow-inset)' }}>
            <Trophy className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <span className="zen-label text-foreground text-xs normal-case tracking-normal font-bold">标题评分</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  stroke="hsl(var(--input))"
                  strokeWidth="7"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <circle
                  stroke={strokeColor}
                  className="transition-all duration-700 ease-out"
                  strokeWidth="7"
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
                <span className={`text-3xl font-extrabold tracking-tight ${scoreColor}`}>{score.overall}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${scoreColor}`}>
              {icon}
              {scoreLabel}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="flex-1 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                />
                <Radar
                  name="评分"
                  dataKey="value"
                  stroke="hsl(var(--foreground))"
                  fill="hsl(var(--foreground))"
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback */}
        {score.feedback && (
          <div className="mt-4 p-4 rounded-2xl bg-input text-sm text-muted-foreground" style={{ boxShadow: 'var(--shadow-inset)' }}>
            💡 {score.feedback}
          </div>
        )}

        {/* Dimension breakdown */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {Object.entries(score.dimensions).map(([key, value]) => (
            <div key={key} className="text-center p-3 rounded-2xl bg-input" style={{ boxShadow: 'var(--shadow-inset)' }}>
              <div className={`text-xl font-extrabold tracking-tight ${getScoreColor(value)}`}>{value}</div>
              <div className="zen-label mt-0.5">{DIMENSION_LABELS[key]}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
