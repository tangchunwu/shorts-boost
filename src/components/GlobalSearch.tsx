import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, FileText, BarChart3, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { PLATFORM_LABELS } from '@/lib/types';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'analysis' | 'record' | 'competitor';
  route: string;
}

const TYPE_META = {
  analysis: { icon: Search, label: 'SEO 分析', color: 'text-primary' },
  record: { icon: FileText, label: '发布记录', color: 'text-emerald-500' },
  competitor: { icon: Users, label: '竞品数据', color: 'text-amber-500' },
} as const;

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const navigate = useNavigate();

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || (!user && !isGuest)) {
      setResults([]);
      return;
    }

    if (isGuest) {
      setResults([]);
      return;
    }

    setLoading(true);
    const term = `%${q.trim()}%`;

    const [analysesRes, recordsRes, competitorsRes] = await Promise.all([
      supabase.from('analyses').select('id, input_title, platform, created_at').ilike('input_title', term).order('created_at', { ascending: false }).limit(5),
      supabase.from('records').select('id, title, platform, published_at').ilike('title', term).order('created_at', { ascending: false }).limit(5),
      supabase.from('competitor_videos').select('id, title, account_name, platform').ilike('title', term).order('created_at', { ascending: false }).limit(5),
    ]);

    const items: SearchResult[] = [];

    analysesRes.data?.forEach(a => items.push({
      id: a.id,
      title: a.input_title || '未命名分析',
      subtitle: `${PLATFORM_LABELS[a.platform as keyof typeof PLATFORM_LABELS] || a.platform} · ${new Date(a.created_at).toLocaleDateString('zh-CN')}`,
      type: 'analysis',
      route: '/analyze',
    }));

    recordsRes.data?.forEach(r => items.push({
      id: r.id,
      title: r.title,
      subtitle: `${PLATFORM_LABELS[r.platform as keyof typeof PLATFORM_LABELS] || r.platform} · ${r.published_at}`,
      type: 'record',
      route: '/records',
    }));

    competitorsRes.data?.forEach(c => items.push({
      id: c.id,
      title: c.title,
      subtitle: `${c.account_name} · ${PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] || c.platform}`,
      type: 'competitor',
      route: '/competitors',
    }));

    setResults(items);
    setLoading(false);
  }, [user, isGuest]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.route);
  };

  const grouped = {
    analysis: results.filter(r => r.type === 'analysis'),
    record: results.filter(r => r.type === 'record'),
    competitor: results.filter(r => r.type === 'competitor'),
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="搜索分析记录、发布记录、竞品数据..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? '搜索中...' : query ? '没有找到相关结果' : '输入关键词开始搜索'}
        </CommandEmpty>
        {(Object.keys(grouped) as Array<keyof typeof grouped>).map(type => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <CommandGroup key={type} heading={meta.label}>
              {items.map(item => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Icon className={`mr-2.5 h-4 w-4 shrink-0 ${meta.color}`} strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
      <div className="border-t px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>↑↓ 导航 · Enter 选择 · Esc 关闭</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
      </div>
    </CommandDialog>
  );
}
