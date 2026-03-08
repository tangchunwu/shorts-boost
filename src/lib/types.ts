export type Platform = 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili';

export const PLATFORM_LABELS: Record<Platform, string> = {
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小红书',
  bilibili: 'B站',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  douyin: 'hsl(340, 82%, 56%)',
  kuaishou: 'hsl(25, 95%, 53%)',
  xiaohongshu: 'hsl(0, 80%, 55%)',
  bilibili: 'hsl(197, 100%, 47%)',
};

export interface PublishRecord {
  id: string;
  title: string;
  platform: Platform;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  performance?: 'high' | 'low' | 'normal';
  createdAt: string;
}

export interface AnalysisHistory {
  id: string;
  inputTitle: string;
  inputScript: string;
  platform: Platform;
  suggestions: SEOSuggestion | null;
  createdAt: string;
}

export interface SEOSuggestion {
  titles: string[];
  keywords: string[];
  tips: string[];
  bestPostTime: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  platform: Platform;
  date: string;
  status: 'planned' | 'published';
  recordId?: string;
}
