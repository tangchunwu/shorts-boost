import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, FileText, BarChart3, Users, CalendarDays, TrendingUp } from 'lucide-react';

const ONBOARDING_KEY = 'onboarding_completed';

const steps = [
  {
    icon: Search,
    title: 'SEO 分析',
    desc: '输入视频标题，AI 为你生成优化方案、关键词推荐和评分',
    color: 'text-primary',
  },
  {
    icon: FileText,
    title: '发布记录',
    desc: '记录每条视频的数据表现，追踪播放量、点赞、评论等指标',
    color: 'text-accent',
  },
  {
    icon: BarChart3,
    title: '数据仪表盘',
    desc: '可视化查看数据趋势，自动生成互动率报告和 AI 洞察',
    color: 'text-success',
  },
  {
    icon: Users,
    title: '竞品监控',
    desc: '记录竞品视频数据，AI 对比分析帮你发现差距和机会',
    color: 'text-warning',
  },
  {
    icon: CalendarDays,
    title: '内容日历',
    desc: '规划发布计划，管理内容排期，不再错过最佳发布时间',
    color: 'text-destructive',
  },
  {
    icon: TrendingUp,
    title: '热门话题',
    desc: '发现各平台热门话题趋势，一键生成优化标题',
    color: 'text-primary',
  },
];

export default function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else handleClose();
  };

  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">欢迎使用短视频 SEO 助手 🎉</DialogTitle>
          <DialogDescription>快速了解核心功能，开始优化你的短视频</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-6 text-center space-y-4">
          <div className={`rounded-2xl bg-secondary p-4 ${current.color}`}>
            <Icon className="h-10 w-10" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{current.title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{current.desc}</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5 pt-2">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`} />
            ))}
          </div>
        </div>
        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleClose}>跳过</Button>
          <Button size="sm" onClick={handleNext}>
            {step < steps.length - 1 ? '下一步' : '开始使用'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
