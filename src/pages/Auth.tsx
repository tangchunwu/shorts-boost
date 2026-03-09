import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 dot-pattern opacity-40" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.2s' }} />

      <Card className="w-full max-w-md animate-fade-in relative z-10 shadow-lg border-border/60">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 shadow-inner">
            <img src={logoImg} alt="短视频增长助手" className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold gradient-text">
            短视频增长助手
          </CardTitle>
          <CardDescription className="text-muted-foreground">优化标题 · 提升流量 · 数据驱动</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={v => setTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/60">
              <TabsTrigger value="login" className="rounded-lg">登录</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 rounded-xl" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 rounded-xl" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-xl btn-primary-glow text-primary-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '登录'}
                </Button>
                <div className="text-center">
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    忘记密码？
                  </Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">用户名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-username" placeholder="你的昵称" value={username} onChange={e => setUsername(e.target.value)} className="pl-9 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 rounded-xl" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-password" type="password" placeholder="至少 6 个字符" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 rounded-xl" required minLength={6} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-xl btn-primary-glow text-primary-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '注册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-5">
            <div className="relative">
              <Separator className="bg-border/60" />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">或</span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 gap-2 border-dashed rounded-xl hover:bg-secondary/60 transition-all"
              onClick={enterGuestMode}
            >
              <Eye className="h-4 w-4" />
              以访客身份体验
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              使用示例数据浏览全部功能，操作不会被保存
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
