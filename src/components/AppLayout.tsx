import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Search, FileText, Calendar, Sun, Moon, Download, Upload, LogOut, Eye, X } from 'lucide-react';
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
  { to: '/records', icon: FileText, label: '发布记录' },
  { to: '/calendar', icon: Calendar, label: '内容日历' },
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-5">
        <div className="mb-2 px-2">
          <h1 className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            📈 短视频增长助手
          </h1>
          <p className="text-xs text-muted-foreground mt-1">优化标题 · 提升流量</p>
        </div>
        <Separator className="my-4" />
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-foreground/40" />
                  )}
                  <Icon className={`h-4 w-4 transition-colors ${isActive ? '' : 'group-hover:text-primary'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <Separator className="my-3" />
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => { downloadBackup(); toast.success('备份已下载'); }} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <Download className="h-4 w-4" /> 备份数据
          </Button>
          <Button variant="ghost" size="sm" onClick={() => restoreInputRef.current?.click()} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <Upload className="h-4 w-4" /> 恢复数据
          </Button>
          <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
          <Separator className="my-2" />
          <Button variant="ghost" size="sm" onClick={() => setDark(!dark)} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? '浅色模式' : '深色模式'}
          </Button>
          {user && (
            <>
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" /> 退出登录
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm px-2 py-1.5">
        <nav className="flex justify-around">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-2 text-xs transition-colors relative ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                  )}
                  <Icon className="h-4 w-4" />
                  <span className={isActive ? 'font-medium' : ''}>{label}</span>
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
  );
}
