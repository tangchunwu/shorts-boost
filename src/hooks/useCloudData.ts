import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PublishRecord, AnalysisHistory, CalendarEvent, SEOSuggestion, Platform } from '@/lib/types';

// ---- Records ----

export function useRecords() {
  const { user } = useAuth();
  const { isGuest, guestRecords } = useGuest();

  return useQuery({
    queryKey: ['records', isGuest ? 'guest' : user?.id],
    queryFn: async (): Promise<PublishRecord[]> => {
      if (isGuest) return guestRecords;
      if (!user) return [];
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        title: r.title,
        platform: r.platform as Platform,
        publishedAt: r.published_at,
        views: r.views,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        tags: r.tags || [],
        performance: (r.performance || 'normal') as 'high' | 'low' | 'normal',
        createdAt: r.created_at,
      }));
    },
    enabled: !!user || isGuest,
  });
}

export function useSaveRecord() {
  const { user } = useAuth();
  const { isGuest, guestRecords, setGuestRecords } = useGuest();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: PublishRecord) => {
      if (isGuest) {
        const all = [...guestRecords];
        const idx = all.findIndex(x => x.id === r.id);
        if (idx >= 0) all[idx] = r; else all.unshift(r);
        setGuestRecords(all);
        return;
      }
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('records').upsert({
        id: r.id,
        user_id: user.id,
        title: r.title,
        platform: r.platform,
        published_at: r.publishedAt,
        views: r.views,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        tags: r.tags,
        performance: r.performance || 'normal',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  });
}

export function useDeleteRecord() {
  const { isGuest, guestRecords, setGuestRecords } = useGuest();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        setGuestRecords(guestRecords.filter(r => r.id !== id));
        return;
      }
      const { error } = await supabase.from('records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  });
}

// ---- Analyses ----

export function useAnalyses() {
  const { user } = useAuth();
  const { isGuest, guestAnalyses } = useGuest();

  return useQuery({
    queryKey: ['analyses', isGuest ? 'guest' : user?.id],
    queryFn: async (): Promise<AnalysisHistory[]> => {
      if (isGuest) return guestAnalyses;
      if (!user) return [];
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(a => ({
        id: a.id,
        inputTitle: a.input_title,
        inputScript: a.input_script,
        platform: a.platform as Platform,
        suggestions: a.suggestions as unknown as SEOSuggestion | null,
        createdAt: a.created_at.slice(0, 10),
      }));
    },
    enabled: !!user || isGuest,
  });
}

export function useSaveAnalysis() {
  const { user } = useAuth();
  const { isGuest, guestAnalyses, setGuestAnalyses } = useGuest();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: AnalysisHistory) => {
      if (isGuest) {
        setGuestAnalyses([a, ...guestAnalyses]);
        return;
      }
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('analyses').insert({
        id: a.id,
        user_id: user.id,
        input_title: a.inputTitle,
        input_script: a.inputScript,
        platform: a.platform,
        suggestions: a.suggestions as any,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['analyses'] }),
  });
}

// ---- Calendar Events ----

export function useCalendarEvents() {
  const { user } = useAuth();
  const { isGuest, guestCalendar } = useGuest();

  return useQuery({
    queryKey: ['calendar_events', isGuest ? 'guest' : user?.id],
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (isGuest) return guestCalendar;
      if (!user) return [];
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map(e => ({
        id: e.id,
        title: e.title,
        platform: e.platform as Platform,
        date: e.date,
        status: e.status as 'planned' | 'published',
        recordId: e.record_id || undefined,
      }));
    },
    enabled: !!user || isGuest,
  });
}

export function useSaveCalendarEvent() {
  const { user } = useAuth();
  const { isGuest, guestCalendar, setGuestCalendar } = useGuest();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: CalendarEvent) => {
      if (isGuest) {
        const all = [...guestCalendar];
        const idx = all.findIndex(x => x.id === e.id);
        if (idx >= 0) all[idx] = e; else all.push(e);
        setGuestCalendar(all);
        return;
      }
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('calendar_events').upsert({
        id: e.id,
        user_id: user.id,
        title: e.title,
        platform: e.platform,
        date: e.date,
        status: e.status,
        record_id: e.recordId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  });
}

export function useDeleteCalendarEvent() {
  const { isGuest, guestCalendar, setGuestCalendar } = useGuest();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        setGuestCalendar(guestCalendar.filter(e => e.id !== id));
        return;
      }
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  });
}
