import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoImg from '@/assets/logo.png';
import { useGuest } from '@/contexts/GuestContext';

export default function Auth() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { enterGuestMode } = useGuest();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success('登录成功！');
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('密码至少 6 个字符'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username },
      },
    });
    if (error) toast.error(error.message);
    else toast.success('注册成功！请检查邮箱验证链接');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* Left: Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative z-10 flex-col items-center justify-center p-12">
        <div className="max-w-md space-y-10 animate-fade-in">
          {/* Big logo */}
          <div className="w-28 h-28 rounded-[32px] flex items-center justify-center bg-card" style={{ boxShadow: 'var(--shadow-float)' }}>
            <img src={logoImg} alt="短视频增长助手" className="w-16 h-16" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              短视频<br />增长助手
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              AI 驱动的短视频标题优化平台，<br />帮助创作者提升流量与互动。
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-5">
            {[
              { icon: TrendingUp, title: '智能标题分析', desc: 'AI 深度解析标题表现力' },
              { icon: BarChart3, title: '数据看板', desc: '多维数据追踪内容趋势' },
              { icon: Zap, title: '一键优化', desc: '基于算法推荐的标题改写' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-card flex items-center justify-center" style={{ boxShadow: 'var(--shadow-btn)' }}>
                  <Icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center bg-card mb-4" style={{ boxShadow: 'var(--shadow-float)' }}>
              <img src={logoImg} alt="短视频增长助手" className="w-11 h-11" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              短视频增长助手
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">优化标题 · 提升流量 · 数据驱动</p>
          </div>

          {/* Form card */}
          <div className="zen-card p-8 rounded-[28px]">
            <div className="hidden lg:block mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {tab === 'login' ? '欢迎回来' : '创建账号'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === 'login' ? '登录以继续使用短视频增长助手' : '免费注册，开始优化你的短视频标题'}
              </p>
            </div>

            <Tabs value={tab} onValueChange={v => setTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="signup">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <Input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-11 h-12" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-xs font-semibold text-muted-foreground">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <Input id="login-password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-11 h-12" required />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '登录'}
                  </Button>
                  <div className="text-center pt-1">
                    <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                      忘记密码？
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-xs font-semibold text-muted-foreground">用户名</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <Input id="signup-username" placeholder="你的昵称" value={username} onChange={e => setUsername(e.target.value)} className="pl-11 h-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-muted-foreground">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-11 h-12" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs font-semibold text-muted-foreground">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <Input id="signup-password" type="password" placeholder="至少 6 个字符" value={password} onChange={e => setPassword(e.target.value)} className="pl-11 h-12" required minLength={6} />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '注册'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">或</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-5 gap-2 h-12"
                onClick={enterGuestMode}
              >
                <Eye className="h-4 w-4" strokeWidth={1.5} />
                以访客身份体验
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                使用示例数据浏览全部功能
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-muted-foreground/60 mt-6">
            登录即表示同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
