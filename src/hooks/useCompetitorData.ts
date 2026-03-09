import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Platform } from '@/lib/types';

export interface CompetitorVideo {
  id: string;
  accountName: string;
  title: string;
  platform: Platform;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

export function useCompetitorVideos() {
  const { user } = useAuth();
  const { isGuest } = useGuest();

  return useQuery({
    queryKey: ['competitor_videos', isGuest ? 'guest' : user?.id],
    queryFn: async (): Promise<CompetitorVideo[]> => {
      if (isGuest) {
        // Guest mode: read from localStorage for backward compat
        try {
          const raw = localStorage.getItem('competitor_videos');
          const arr = raw ? JSON.parse(raw) : [];
          return arr.map((c: any) => ({ ...c, shares: c.shares || 0, createdAt: c.createdAt || new Date().toISOString() }));
        } catch { return []; }
      }
      if (!user) return [];
      const { data, error } = await supabase
        .from('competitor_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        accountName: r.account_name,
        title: r.title,
        platform: r.platform as Platform,
        publishedAt: r.published_at,
        views: r.views,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        createdAt: r.created_at,
      }));
    },
    enabled: !!user || isGuest,
  });
}

export function useSaveCompetitorVideo() {
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (v: CompetitorVideo) => {
      if (isGuest) {
        // Guest: localStorage
        try {
          const raw = localStorage.getItem('competitor_videos');
          const arr = raw ? JSON.parse(raw) : [];
          arr.unshift(v);
          localStorage.setItem('competitor_videos', JSON.stringify(arr));
        } catch {}
        return;
      }
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('competitor_videos').upsert({
        id: v.id,
        user_id: user.id,
        account_name: v.accountName,
        title: v.title,
        platform: v.platform,
        published_at: v.publishedAt,
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitor_videos'] }),
  });
}

export function useDeleteCompetitorVideo() {
  const { isGuest } = useGuest();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        try {
          const raw = localStorage.getItem('competitor_videos');
          const arr = raw ? JSON.parse(raw) : [];
          localStorage.setItem('competitor_videos', JSON.stringify(arr.filter((c: any) => c.id !== id)));
        } catch {}
        return;
      }
      const { error } = await supabase.from('competitor_videos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitor_videos'] }),
  });
}
