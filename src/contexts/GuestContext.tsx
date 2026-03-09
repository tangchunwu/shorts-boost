import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PublishRecord, AnalysisHistory, CalendarEvent } from '@/lib/types';

// --- Mock data for guest mode ---
const MOCK_RECORDS: PublishRecord[] = [
  { id: 'g1', title: '【实测】早起一个月，身体竟然发生了这些变化', platform: 'douyin', publishedAt: '2026-02-10', views: 128400, likes: 9200, comments: 740, shares: 430, tags: ['生活', '健康'], performance: 'high', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'g2', title: '3分钟学会番茄炒蛋，新手零失败！', platform: 'douyin', publishedAt: '2026-02-15', views: 54300, likes: 3800, comments: 290, shares: 175, tags: ['美食', '教程'], performance: 'normal', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'g3', title: '小红书涨粉技巧分享，从0到1万只用了3个月', platform: 'xiaohongshu', publishedAt: '2026-02-18', views: 22100, likes: 1560, comments: 430, shares: 88, tags: ['运营', '涨粉'], performance: 'high', createdAt: '2026-02-18T10:00:00Z' },
  { id: 'g4', title: '周末Vlog | 去了一个超小众的古镇', platform: 'bilibili', publishedAt: '2026-02-22', views: 8700, likes: 520, comments: 130, shares: 45, tags: ['vlog', '旅行'], performance: 'low', createdAt: '2026-02-22T10:00:00Z' },
  { id: 'g5', title: '减脂期这样吃，一个月瘦了8斤', platform: 'kuaishou', publishedAt: '2026-03-01', views: 67800, likes: 5100, comments: 610, shares: 320, tags: ['减脂', '健康'], performance: 'high', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'g6', title: '程序员的一天，6点到23点', platform: 'bilibili', publishedAt: '2026-03-05', views: 18900, likes: 1240, comments: 380, shares: 95, tags: ['程序员', 'vlog'], performance: 'normal', createdAt: '2026-03-05T10:00:00Z' },
];

const MOCK_ANALYSES: AnalysisHistory[] = [
  {
    id: 'ga1',
    inputTitle: '早起挑战一个月',
    inputScript: '记录自己早起一个月的经历和变化',
    platform: 'douyin',
    suggestions: {
      titles: ['【打卡30天】早起挑战，身体居然悄悄变了！', '坚持早起一个月，这3个变化让我震惊', '早起30天真实记录，普通人能做到吗？'],
      keywords: ['早起挑战', '打卡', '自律', '生活改变', '健康习惯', '30天挑战'],
      tips: ['标题加入数字更具体', '用反问句引发好奇', '封面突出对比效果'],
      bestPostTime: '工作日早上 7:00-8:00，或晚上 21:00-22:00',
    },
    createdAt: '2026-03-01',
  },
];

const MOCK_CALENDAR: CalendarEvent[] = [
  { id: 'gc1', title: '减脂食谱大合集', platform: 'douyin', date: '2026-03-12', status: 'planned' },
  { id: 'gc2', title: '春日穿搭分享', platform: 'xiaohongshu', date: '2026-03-15', status: 'planned' },
  { id: 'gc3', title: '周末城市探店vlog', platform: 'bilibili', date: '2026-03-22', status: 'planned' },
];

interface GuestContextValue {
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  // In-memory data stores
  guestRecords: PublishRecord[];
  setGuestRecords: (r: PublishRecord[]) => void;
  guestAnalyses: AnalysisHistory[];
  setGuestAnalyses: (a: AnalysisHistory[]) => void;
  guestCalendar: CalendarEvent[];
  setGuestCalendar: (c: CalendarEvent[]) => void;
}

const GuestContext = createContext<GuestContextValue | null>(null);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(() => sessionStorage.getItem('guest-mode') === 'true');
  const [guestRecords, setGuestRecordsState] = useState<PublishRecord[]>(MOCK_RECORDS);
  const [guestAnalyses, setGuestAnalysesState] = useState<AnalysisHistory[]>(MOCK_ANALYSES);
  const [guestCalendar, setGuestCalendarState] = useState<CalendarEvent[]>(MOCK_CALENDAR);

  const enterGuestMode = useCallback(() => {
    sessionStorage.setItem('guest-mode', 'true');
    setIsGuest(true);
    // Reset to mock data each time
    setGuestRecordsState(MOCK_RECORDS);
    setGuestAnalysesState(MOCK_ANALYSES);
    setGuestCalendarState(MOCK_CALENDAR);
  }, []);

  const exitGuestMode = useCallback(() => {
    sessionStorage.removeItem('guest-mode');
    setIsGuest(false);
  }, []);

  const setGuestRecords = useCallback((r: PublishRecord[]) => setGuestRecordsState(r), []);
  const setGuestAnalyses = useCallback((a: AnalysisHistory[]) => setGuestAnalysesState(a), []);
  const setGuestCalendar = useCallback((c: CalendarEvent[]) => setGuestCalendarState(c), []);

  return (
    <GuestContext.Provider value={{ isGuest, enterGuestMode, exitGuestMode, guestRecords, setGuestRecords, guestAnalyses, setGuestAnalyses, guestCalendar, setGuestCalendar }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used within GuestProvider');
  return ctx;
}
