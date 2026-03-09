import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Platform, PLATFORM_LABELS } from '@/lib/types';
import { runComplianceCheck } from '@/lib/compliance';
import { ShieldCheck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ComplianceCheckCardProps {
  title: string;
  keywords: string[];
  platform: Platform;
  className?: string;
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/8 border border-success/15', label: '通过' },
  warn: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/8 border border-warning/15', label: '警告' },
  fail: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/8 border border-destructive/15', label: '不通过' },
};

export default function ComplianceCheckCard({ title, keywords, platform, className }: ComplianceCheckCardProps) {
  const results = runComplianceCheck(title, keywords, platform);
  const passCount = results.filter(r => r.result.status === 'pass').length;
  const total = results.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          平台合规检查
          <Badge variant="secondary" className="ml-auto text-xs rounded-full">
            {PLATFORM_LABELS[platform]} · {passCount}/{total} 通过
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {results.map(item => {
            const config = STATUS_CONFIG[item.result.status];
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-xl ${config.bg} transition-all duration-200`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.result.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
