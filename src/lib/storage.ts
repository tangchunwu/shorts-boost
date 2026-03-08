import { PublishRecord, AnalysisHistory, CalendarEvent } from './types';

const KEYS = {
  records: 'shorts-records',
  analyses: 'shorts-analyses',
  calendar: 'shorts-calendar',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Records
export const getRecords = (): PublishRecord[] => get(KEYS.records, []);
export const saveRecord = (r: PublishRecord) => {
  const all = getRecords();
  const idx = all.findIndex(x => x.id === r.id);
  if (idx >= 0) all[idx] = r; else all.unshift(r);
  set(KEYS.records, all);
};
export const deleteRecord = (id: string) => {
  set(KEYS.records, getRecords().filter(r => r.id !== id));
};

// Analyses
export const getAnalyses = (): AnalysisHistory[] => get(KEYS.analyses, []);
export const saveAnalysis = (a: AnalysisHistory) => {
  const all = getAnalyses();
  all.unshift(a);
  set(KEYS.analyses, all);
};

// Calendar
export const getCalendarEvents = (): CalendarEvent[] => get(KEYS.calendar, []);
export const saveCalendarEvent = (e: CalendarEvent) => {
  const all = getCalendarEvents();
  const idx = all.findIndex(x => x.id === e.id);
  if (idx >= 0) all[idx] = e; else all.push(e);
  set(KEYS.calendar, all);
};
export const deleteCalendarEvent = (id: string) => {
  set(KEYS.calendar, getCalendarEvents().filter(e => e.id !== id));
};

// Backup & Restore
export interface BackupData {
  version: 1;
  exportedAt: string;
  records: PublishRecord[];
  analyses: AnalysisHistory[];
  calendar: CalendarEvent[];
}

export const exportAllData = (): BackupData => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  records: getRecords(),
  analyses: getAnalyses(),
  calendar: getCalendarEvents(),
});

export const downloadBackup = () => {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shorts-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const restoreFromBackup = (json: string): { success: boolean; counts: { records: number; analyses: number; calendar: number } | null; error?: string } => {
  try {
    const data = JSON.parse(json) as BackupData;
    if (!data.version || !Array.isArray(data.records) || !Array.isArray(data.analyses) || !Array.isArray(data.calendar)) {
      return { success: false, counts: null, error: '无效的备份文件格式' };
    }
    set(KEYS.records, data.records);
    set(KEYS.analyses, data.analyses);
    set(KEYS.calendar, data.calendar);
    return { success: true, counts: { records: data.records.length, analyses: data.analyses.length, calendar: data.calendar.length } };
  } catch {
    return { success: false, counts: null, error: '无法解析备份文件' };
  }
};
