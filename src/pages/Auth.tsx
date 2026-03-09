import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative">
      <Card className="w-full max-w-[420px] animate-fade-in zen-float">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-[72px] h-[72px] rounded-[22px] flex items-center justify-center bg-input" style={{ boxShadow: 'var(--shadow-inset)' }}>
            <img src={logoImg} alt="短视频增长助手" className="w-9 h-9" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
            短视频增长助手
          </CardTitle>
          <CardDescription className="zen-label mt-2">优化标题 · 提升流量 · 数据驱动</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Tabs value={tab} onValueChange={v => setTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="zen-label">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-11" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="zen-label">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input id="login-password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-11" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '登录'}
                </Button>
                <div className="text-center">
                  <Link to="/forgot-password" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-bold">
                    忘记密码？
                  </Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="zen-label">用户名</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input id="signup-username" placeholder="你的昵称" value={username} onChange={e => setUsername(e.target.value)} className="pl-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="zen-label">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-11" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="zen-label">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input id="signup-password" type="password" placeholder="至少 6 个字符" value={password} onChange={e => setPassword(e.target.value)} className="pl-11" required minLength={6} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
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
                <span className="bg-card px-3 zen-label">或</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-5 gap-2"
              onClick={enterGuestMode}
            >
              <Eye className="h-4 w-4" strokeWidth={1.5} />
              以访客身份体验
            </Button>
            <p className="text-center zen-label mt-3">
              使用示例数据浏览全部功能
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
