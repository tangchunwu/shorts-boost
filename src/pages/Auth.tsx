import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="text-3xl mb-2">📈</div>
          <CardTitle className="text-xl bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            短视频增长助手
          </CardTitle>
          <CardDescription>优化标题 · 提升流量 · 数据驱动</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={v => setTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full" style={{ backgroundImage: 'var(--gradient-primary)' }}>
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
                    <Input id="signup-username" placeholder="你的昵称" value={username} onChange={e => setUsername(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-password" type="password" placeholder="至少 6 个字符" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required minLength={6} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '注册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
