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
  pass: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: '通过' },
  warn: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: '警告' },
  fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: '不通过' },
};

export default function ComplianceCheckCard({ title, keywords, platform, className }: ComplianceCheckCardProps) {
  const results = runComplianceCheck(title, keywords, platform);
  const passCount = results.filter(r => r.result.status === 'pass').length;
  const total = results.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          平台合规检查
          <Badge variant="secondary" className="ml-auto text-xs">
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
                className={`flex items-start gap-3 p-2.5 rounded-lg ${config.bg} transition-colors`}
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
