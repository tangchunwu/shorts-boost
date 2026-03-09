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
  pass: { icon: CheckCircle, color: 'text-success', label: '通过' },
  warn: { icon: AlertTriangle, color: 'text-warning', label: '警告' },
  fail: { icon: XCircle, color: 'text-destructive', label: '不通过' },
};

export default function ComplianceCheckCard({ title, keywords, platform, className }: ComplianceCheckCardProps) {
  const results = runComplianceCheck(title, keywords, platform);
  const passCount = results.filter(r => r.result.status === 'pass').length;
  const total = results.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-input" style={{ boxShadow: 'var(--shadow-inset)' }}>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-bold">平台合规检查</span>
          <Badge variant="secondary" className="ml-auto">
            {PLATFORM_LABELS[platform]} · {passCount}/{total}
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
                className="flex items-start gap-3 p-4 rounded-2xl bg-input transition-all duration-200"
                style={{ boxShadow: 'var(--shadow-inset)' }}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold">{item.label}</span>
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
