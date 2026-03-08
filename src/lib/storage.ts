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
