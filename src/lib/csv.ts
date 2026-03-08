import { PublishRecord, Platform, PLATFORM_LABELS } from './types';

const CSV_HEADERS = ['标题', '平台', '发布日期', '播放量', '点赞数', '评论数', '分享数', '标签', '表现'];

const PLATFORM_REVERSE: Record<string, Platform> = {};
Object.entries(PLATFORM_LABELS).forEach(([k, v]) => { PLATFORM_REVERSE[v] = k as Platform; });

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportToCSV(records: PublishRecord[]): void {
  const rows = [CSV_HEADERS.join(',')];
  for (const r of records) {
    rows.push([
      escapeCSV(r.title),
      PLATFORM_LABELS[r.platform],
      r.publishedAt,
      String(r.views),
      String(r.likes),
      String(r.comments),
      String(r.shares),
      escapeCSV(r.tags.join('|')),
      r.performance || 'normal',
    ].join(','));
  }
  const bom = '\uFEFF';
  const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `短视频记录_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSV(text: string): { records: PublishRecord[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { records: [], errors: ['CSV 文件为空或缺少数据行'] };

  const header = parseCSVLine(lines[0]);
  // Try to detect column indices by header names
  const titleIdx = header.findIndex(h => h.includes('标题'));
  const platformIdx = header.findIndex(h => h.includes('平台'));
  const dateIdx = header.findIndex(h => h.includes('日期'));
  const viewsIdx = header.findIndex(h => h.includes('播放'));
  const likesIdx = header.findIndex(h => h.includes('点赞'));
  const commentsIdx = header.findIndex(h => h.includes('评论'));
  const sharesIdx = header.findIndex(h => h.includes('分享'));
  const tagsIdx = header.findIndex(h => h.includes('标签'));
  const perfIdx = header.findIndex(h => h.includes('表现'));

  const records: PublishRecord[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const title = titleIdx >= 0 ? cols[titleIdx] : cols[0];
    if (!title?.trim()) { errors.push(`第 ${i + 1} 行：标题为空，已跳过`); continue; }

    const platformText = platformIdx >= 0 ? cols[platformIdx] : cols[1];
    const platform = PLATFORM_REVERSE[platformText?.trim()] || 'douyin';

    const dateText = dateIdx >= 0 ? cols[dateIdx] : cols[2];
    const tagsText = tagsIdx >= 0 ? cols[tagsIdx] : cols[7];
    const perfText = perfIdx >= 0 ? cols[perfIdx] : cols[8];

    records.push({
      id: crypto.randomUUID(),
      title: title.trim(),
      platform,
      publishedAt: dateText?.trim() || new Date().toISOString().slice(0, 10),
      views: parseInt(viewsIdx >= 0 ? cols[viewsIdx] : cols[3]) || 0,
      likes: parseInt(likesIdx >= 0 ? cols[likesIdx] : cols[4]) || 0,
      comments: parseInt(commentsIdx >= 0 ? cols[commentsIdx] : cols[5]) || 0,
      shares: parseInt(sharesIdx >= 0 ? cols[sharesIdx] : cols[6]) || 0,
      tags: tagsText ? tagsText.split('|').filter(Boolean) : [],
      performance: (['high', 'low', 'normal'].includes(perfText?.trim()) ? perfText.trim() : 'normal') as 'high' | 'low' | 'normal',
      createdAt: new Date().toISOString(),
    });
  }

  return { records, errors };
}
