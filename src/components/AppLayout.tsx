import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Search, FileText, Calendar, Sun, Moon, Download, Upload, LogOut, Eye, X, Flame, Users } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { downloadBackup, restoreFromBackup } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { toast } from 'sonner';

const navItems = [
  { to: '/', icon: BarChart3, label: '仪表盘' },
  { to: '/analyze', icon: Search, label: 'SEO 分析' },
  { to: '/trending', icon: Flame, label: '热门话题' },
  { to: '/records', icon: FileText, label: '发布记录' },
  { to: '/calendar', icon: Calendar, label: '内容日历' },
  { to: '/competitors', icon: Users, label: '竞品监控' },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { isGuest, exitGuestMode } = useGuest();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = restoreFromBackup(ev.target?.result as string);
      if (result.success && result.counts) {
        toast.success(`恢复成功：${result.counts.records} 条记录、${result.counts.analyses} 条分析、${result.counts.calendar} 条日历`);
        window.location.reload();
      } else {
        toast.error(result.error || '恢复失败');
      }
    };
    reader.readAsText(file);
    if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('已退出登录');
  };

  const handleExitGuest = () => {
    exitGuestMode();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen bg-background flex-col">
      {/* Mobile top header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 glass-strong">
        <h1 className="text-base font-bold gradient-text">
          📈 短视频增长助手
        </h1>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Guest banner */}
      {isGuest && (
        <div className="bg-accent/8 border-b border-accent/15 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1 rounded-full bg-accent/15">
              <Eye className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-accent font-medium">访客模式</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">— 你正在使用示例数据，所有操作不会被保存</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-full" onClick={handleExitGuest}>
              <X className="h-3 w-3" /> 退出访客
            </Button>
            <Button size="sm" className="h-7 text-xs rounded-full btn-primary-glow" onClick={handleExitGuest}>
              注册 / 登录
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[260px] flex-col border-r border-border/60 bg-card/50 backdrop-blur-sm p-5">
          <div className="mb-1 px-2">
            <h1 className="text-lg font-bold gradient-text">
              📈 短视频增长助手
            </h1>
            <p className="text-xs text-muted-foreground mt-1">优化标题 · 提升流量</p>
          </div>
          <Separator className="my-4 bg-border/60" />
          <nav className="flex-1 space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-250 group ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                  }`
                }
                style={({ isActive }) => isActive ? { backgroundImage: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' } : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary-foreground/15' : 'bg-transparent group-hover:bg-muted'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <Separator className="my-3 bg-border/60" />
          <div className="space-y-0.5">
            <Button variant="ghost" size="sm" onClick={() => { downloadBackup(); toast.success('备份已下载'); }} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground rounded-xl">
              <Download className="h-4 w-4" /> 备份数据
            </Button>
            <Button variant="ghost" size="sm" onClick={() => restoreInputRef.current?.click()} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground rounded-xl">
              <Upload className="h-4 w-4" /> 恢复数据
            </Button>
            <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
            <Separator className="my-2 bg-border/60" />
            <Button variant="ghost" size="sm" onClick={() => setDark(!dark)} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground rounded-xl">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {dark ? '浅色模式' : '深色模式'}
            </Button>
            {isGuest ? (
              <Button variant="ghost" size="sm" onClick={handleExitGuest} className="w-full justify-start gap-2 text-muted-foreground hover:text-primary rounded-xl">
                <LogOut className="h-4 w-4" /> 退出访客模式
              </Button>
            ) : user && (
              <>
                <div className="px-3 py-2 mt-1 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive rounded-xl">
                  <LogOut className="h-4 w-4" /> 退出登录
                </Button>
              </>
            )}
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 glass-strong">
          {isGuest && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-accent/8 border-b border-accent/15">
              <div className="flex items-center gap-1.5 text-xs">
                <Eye className="h-3 w-3 text-accent" />
                <span className="text-accent font-medium">访客模式</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1 text-accent hover:text-accent rounded-full" onClick={handleExitGuest}>
                <X className="h-3 w-3" /> 退出
              </Button>
            </div>
          )}
          <nav className="flex justify-around px-2 py-1.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2 text-xs transition-all duration-200 relative ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ backgroundImage: 'var(--gradient-primary)' }} />
                    )}
                    <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-5xl p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
