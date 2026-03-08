import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PublishRecord, AnalysisHistory, CalendarEvent, SEOSuggestion, Platform } from '@/lib/types';

// ---- Records ----

export function useRecords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['records', user?.id],
    queryFn: async (): Promise<PublishRecord[]> => {
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
    enabled: !!user,
  });
}

export function useSaveRecord() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: PublishRecord) => {
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  });
}

// ---- Analyses ----

export function useAnalyses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['analyses', user?.id],
    queryFn: async (): Promise<AnalysisHistory[]> => {
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
        suggestions: a.suggestions as SEOSuggestion | null,
        createdAt: a.created_at.slice(0, 10),
      }));
    },
    enabled: !!user,
  });
}

export function useSaveAnalysis() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: AnalysisHistory) => {
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
  return useQuery({
    queryKey: ['calendar_events', user?.id],
    queryFn: async (): Promise<CalendarEvent[]> => {
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
    enabled: !!user,
  });
}

export function useSaveCalendarEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: CalendarEvent) => {
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  });
}
