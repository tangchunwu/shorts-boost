import { Platform } from './types';

export interface ComplianceRule {
  id: string;
  label: string;
  check: (title: string, keywords: string[], platform: Platform) => ComplianceResult;
}

export interface ComplianceResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

const PLATFORM_TITLE_LIMITS: Record<Platform, { min: number; max: number }> = {
  douyin: { min: 5, max: 30 },
  kuaishou: { min: 5, max: 30 },
  xiaohongshu: { min: 5, max: 20 },
  bilibili: { min: 5, max: 80 },
};

const PLATFORM_TAG_LIMITS: Record<Platform, { min: number; max: number }> = {
  douyin: { min: 2, max: 5 },
  kuaishou: { min: 2, max: 5 },
  xiaohongshu: { min: 3, max: 10 },
  bilibili: { min: 1, max: 10 },
};

const SENSITIVE_WORDS = [
  '最好', '第一', '唯一', '绝对', '100%', '万能', '秒杀',
  '免费领', '赚大钱', '日入过万', '暴富', '躺赚',
  '国家机密', '政治', '赌博', '色情',
];

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'title-length',
    label: '标题字数',
    check: (title, _kw, platform) => {
      const len = title.length;
      const { min, max } = PLATFORM_TITLE_LIMITS[platform];
      if (len === 0) return { status: 'fail', message: '标题不能为空' };
      if (len < min) return { status: 'warn', message: `标题过短（${len}字），建议 ${min}-${max} 字` };
      if (len > max) return { status: 'fail', message: `标题过长（${len}字），平台限制 ${max} 字以内` };
      return { status: 'pass', message: `${len}字，符合平台要求（${min}-${max}字）` };
    },
  },
  {
    id: 'sensitive-words',
    label: '敏感词检测',
    check: (title) => {
      const found = SENSITIVE_WORDS.filter(w => title.includes(w));
      if (found.length > 0) return { status: 'warn', message: `包含敏感词：${found.join('、')}，可能被限流` };
      return { status: 'pass', message: '未检测到常见敏感词' };
    },
  },
  {
    id: 'tag-count',
    label: '标签数量',
    check: (_title, keywords, platform) => {
      const count = keywords.length;
      const { min, max } = PLATFORM_TAG_LIMITS[platform];
      if (count < min) return { status: 'warn', message: `标签较少（${count}个），建议 ${min}-${max} 个` };
      if (count > max) return { status: 'warn', message: `标签过多（${count}个），建议不超过 ${max} 个` };
      return { status: 'pass', message: `${count}个标签，符合要求（${min}-${max}个）` };
    },
  },
  {
    id: 'emoji-check',
    label: 'Emoji 使用',
    check: (title, _kw, platform) => {
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      const hasEmoji = emojiRegex.test(title);
      if (platform === 'xiaohongshu' && !hasEmoji) {
        return { status: 'warn', message: '小红书标题建议添加 Emoji 提升吸引力' };
      }
      if (platform === 'bilibili' && hasEmoji) {
        return { status: 'warn', message: 'B站标题一般不使用 Emoji' };
      }
      return { status: 'pass', message: 'Emoji 使用适当' };
    },
  },
  {
    id: 'hook-check',
    label: '钩子词检测',
    check: (title) => {
      const hooks = ['教你', '必看', '千万别', '居然', '竟然', '没想到', '太', '绝了', '神了', '震惊', '速看', '赶紧'];
      const found = hooks.filter(h => title.includes(h));
      if (found.length === 0) return { status: 'warn', message: '缺少钩子词，建议添加如「教你」「必看」等吸引词' };
      return { status: 'pass', message: `包含钩子词：${found.join('、')}` };
    },
  },
];

export function runComplianceCheck(title: string, keywords: string[], platform: Platform) {
  return COMPLIANCE_RULES.map(rule => ({
    ...rule,
    result: rule.check(title, keywords, platform),
  }));
}
