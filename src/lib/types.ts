export type Platform = 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili';

export const PLATFORM_LABELS: Record<Platform, string> = {
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小红书',
  bilibili: 'B站',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  douyin: 'hsl(350, 22%, 62%)',
  kuaishou: 'hsl(25, 28%, 58%)',
  xiaohongshu: 'hsl(0, 22%, 58%)',
  bilibili: 'hsl(200, 25%, 55%)',
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

export interface TitleScore {
  overall: number;
  dimensions: {
    appeal: number;       // 吸引力
    keywords: number;     // 关键词密度
    platformFit: number;  // 平台适配度
    length: number;       // 字数合理性
  };
  feedback: string;       // 改进建议
}

export interface SEOSuggestion {
  titles: string[];
  keywords: string[];
  tips: string[];
  bestPostTime: string;
  titleScore?: TitleScore;
}

export interface CalendarEvent {
  id: string;
  title: string;
  platform: Platform;
  date: string;
  status: 'planned' | 'published';
  recordId?: string;
}
