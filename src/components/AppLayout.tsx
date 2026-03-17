import { NavLink, useNavigate } from 'react-router-dom';
import AnimatedOutlet from '@/components/AnimatedOutlet';
import GlobalSearch from '@/components/GlobalSearch';
import { BarChart3, Search, FileText, Calendar, Sun, Moon, Download, Upload, LogOut, Eye, X, Flame, Users, FolderOpen } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { downloadBackup, restoreFromBackup } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { toast } from 'sonner';

const navItems = [
  { to: '/', icon: BarChart3, label: '仪表盘', tourId: 'tour-nav-dashboard' },
  { to: '/analyze', icon: Search, label: 'SEO 分析', tourId: 'tour-nav-analyze' },
  { to: '/trending', icon: Flame, label: '热门话题', tourId: 'tour-nav-trending' },
  { to: '/records', icon: FileText, label: '发布记录', tourId: 'tour-nav-records' },
  { to: '/calendar', icon: Calendar, label: '内容日历', tourId: 'tour-nav-calendar' },
  { to: '/competitors', icon: Users, label: '竞品监控', tourId: 'tour-nav-competitors' },
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/analyze');
        toast.success('快捷键：新建 SEO 分析', { duration: 1500 });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        navigate('/records');
        toast.success('快捷键：添加发布记录', { duration: 1500 });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

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
      <GlobalSearch />
      {/* Mobile top header */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 glass-strong">
        <h1 className="text-sm font-extrabold tracking-tight text-foreground">
          📈 短视频增长助手
        </h1>
        <button
          onClick={() => setDark(!dark)}
          className="h-9 w-9 rounded-xl flex items-center justify-center bg-input active:scale-[0.93] transition-all"
          style={{ boxShadow: 'var(--shadow-inset)' }}
        >
          {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Guest banner */}
      {isGuest && (
        <div className="bg-warning/5 border-b border-warning/10 px-5 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="p-1.5 rounded-xl bg-warning/10">
              <Eye className="h-3.5 w-3.5 text-warning" strokeWidth={2} />
            </div>
            <span className="font-semibold text-foreground text-xs">访客模式</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">— 示例数据，操作不会保存</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5" onClick={handleExitGuest}>
              <X className="h-3 w-3" /> 退出
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleExitGuest}>
              注册 / 登录
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — Frosted glass panel */}
        <aside className="hidden md:flex w-[264px] flex-col p-4 sticky top-0 max-h-screen">
          <div className="flex-1 flex flex-col min-h-0 rounded-[28px] bg-card p-5" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--glass-border-outer)' }}>
            <div className="mb-1 px-1">
              <h1 className="text-base font-extrabold tracking-tight text-foreground">
                📈 短视频增长助手
              </h1>
              <p className="zen-label mt-1.5">优化标题 · 提升流量</p>
            </div>
            <Separator className="my-4 bg-border/50" />
            <nav className="flex-1 space-y-1 overflow-y-auto min-h-0">
              {navItems.map(({ to, icon: Icon, label, tourId }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  id={tourId}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`
                  }
                  style={({ isActive }) => isActive ? { boxShadow: 'var(--shadow-btn)' } : undefined}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <Separator className="my-3 bg-border/50" />
            <div className="space-y-0.5 shrink-0">
              <button onClick={() => { downloadBackup(); toast.success('备份已下载'); }} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-[0.97]">
                <Download className="h-4 w-4" strokeWidth={1.5} /> 备份数据
              </button>
              <button onClick={() => restoreInputRef.current?.click()} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-[0.97]">
                <Upload className="h-4 w-4" strokeWidth={1.5} /> 恢复数据
              </button>
              <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
              <Separator className="my-2 bg-border/50" />
              <button id="tour-theme-toggle" onClick={() => setDark(!dark)} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-[0.97]">
                {dark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
                {dark ? '浅色模式' : '深色模式'}
              </button>
              {isGuest ? (
                <button onClick={handleExitGuest} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-[0.97]">
                  <LogOut className="h-4 w-4" strokeWidth={1.5} /> 退出访客
                </button>
              ) : user && (
                <>
                  <div className="px-3 py-2 mt-1 rounded-xl bg-input" style={{ boxShadow: 'var(--shadow-inset)' }}>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-bold">{user.email}</p>
                  </div>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive/70 hover:bg-destructive/5 hover:text-destructive transition-all active:scale-[0.97]">
                    <LogOut className="h-4 w-4" strokeWidth={1.5} /> 退出登录
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong">
          {isGuest && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-warning/5 border-b border-warning/10">
              <div className="flex items-center gap-1.5 text-xs">
                <Eye className="h-3 w-3 text-warning" strokeWidth={2} />
                <span className="font-bold text-foreground">访客</span>
              </div>
              <button onClick={handleExitGuest} className="text-[10px] font-bold text-warning uppercase tracking-wider active:scale-[0.95]">退出</button>
            </div>
          )}
          <nav className="flex justify-around px-1 py-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] transition-all duration-200 relative active:scale-[0.93] ${
                    isActive ? 'text-foreground font-bold' : 'text-muted-foreground'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-foreground" />
                    )}
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary text-primary-foreground' : ''}`}>
                      <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.5} />
                    </div>
                    <span className="tracking-tight">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-24 md:pb-0">
          <div className="mx-auto max-w-5xl p-4 md:p-8">
            <AnimatedOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
