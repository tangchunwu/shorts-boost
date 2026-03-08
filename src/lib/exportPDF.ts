import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { PublishRecord, Platform } from '@/lib/types';
import { PLATFORM_LABELS } from '@/lib/types';
import type { Insight } from '@/components/AIInsightsCard';

interface ExportData {
  records: PublishRecord[];
  insights: Insight[];
  platformFilter: string;
  timeRange: string;
  chartElements?: {
    pieCharts: HTMLElement | null;
    trendChart: HTMLElement | null;
  };
}

const INSIGHT_EMOJI: Record<string, string> = {
  trend: '📈',
  anomaly: '⚡',
  tip: '💡',
  warning: '⚠️',
};

async function captureElement(el: HTMLElement | null): Promise<string | null> {
  if (!el) return null;
  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export async function exportDashboardPDF(data: ExportData) {
  const { records, insights, platformFilter, timeRange, chartElements } = data;

  // Capture charts in parallel before building the report
  const [pieChartsImg, trendChartImg] = await Promise.all([
    captureElement(chartElements?.pieCharts ?? null),
    captureElement(chartElements?.trendChart ?? null),
  ]);

  const totalViews = records.reduce((s, r) => s + r.views, 0);
  const totalLikes = records.reduce((s, r) => s + r.likes, 0);
  const totalComments = records.reduce((s, r) => s + r.comments, 0);
  const totalShares = records.reduce((s, r) => s + r.shares, 0);
  const avgViews = records.length ? Math.round(totalViews / records.length) : 0;
  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2) : '0.00';
  const likeRate = totalViews > 0 ? (totalLikes / totalViews * 100).toFixed(2) : '0.00';
  const commentRate = totalViews > 0 ? (totalComments / totalViews * 100).toFixed(2) : '0.00';
  const shareRate = totalViews > 0 ? (totalShares / totalViews * 100).toFixed(2) : '0.00';

  const timeLabel = timeRange === '7d' ? '最近 7 天' : timeRange === '30d' ? '最近 30 天' : '全部时间';
  const platformLabel = platformFilter === 'all' ? '全部平台' : PLATFORM_LABELS[platformFilter as Platform];
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Platform breakdown
  const platformBreakdown: Record<string, { count: number; views: number; likes: number }> = {};
  for (const r of records) {
    if (!platformBreakdown[r.platform]) platformBreakdown[r.platform] = { count: 0, views: 0, likes: 0 };
    platformBreakdown[r.platform].count++;
    platformBreakdown[r.platform].views += r.views;
    platformBreakdown[r.platform].likes += r.likes;
  }

  // Top 10 records
  const topRecords = [...records].sort((a, b) => b.views - a.views).slice(0, 10);

  // Build HTML report
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#fff;color:#1a1a2e;font-family:"Noto Sans SC",system-ui,sans-serif;padding:48px;line-height:1.6;';

  container.innerHTML = `
    <div style="margin-bottom:36px;">
      <h1 style="font-size:28px;font-weight:700;color:#5a6a8a;margin:0;">📈 短视频增长助手 — 数据报告</h1>
      <p style="color:#8a8a9a;font-size:13px;margin-top:8px;">生成时间：${dateStr}　|　筛选：${platformLabel} · ${timeLabel}</p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;">
      ${[
        { label: '总发布数', value: records.length },
        { label: '总播放量', value: totalViews.toLocaleString() },
        { label: '总点赞数', value: totalLikes.toLocaleString() },
        { label: '平均播放', value: avgViews.toLocaleString() },
      ].map(s => `
        <div style="background:#f5f3f0;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:#8a8a9a;margin-bottom:4px;">${s.label}</div>
          <div style="font-size:22px;font-weight:700;color:#1a1a2e;">${s.value}</div>
        </div>
      `).join('')}
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;">
      ${[
        { label: '综合互动率', value: `${engagementRate}%`, desc: '(赞+评+转)/播放' },
        { label: '点赞率', value: `${likeRate}%`, desc: '点赞/播放' },
        { label: '评论率', value: `${commentRate}%`, desc: '评论/播放' },
        { label: '转发率', value: `${shareRate}%`, desc: '分享/播放' },
      ].map(s => `
        <div style="background:#f5f3f0;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:#8a8a9a;margin-bottom:4px;">${s.label}</div>
          <div style="font-size:20px;font-weight:700;color:#1a1a2e;">${s.value}</div>
          <div style="font-size:10px;color:#aaa;margin-top:2px;">${s.desc}</div>
        </div>
      `).join('')}
    </div>

    ${pieChartsImg ? `
      <h2 style="font-size:16px;font-weight:600;color:#5a6a8a;margin-bottom:12px;">📊 平台分布</h2>
      <div style="margin-bottom:32px;text-align:center;">
        <img src="${pieChartsImg}" style="max-width:100%;border-radius:12px;" />
      </div>
    ` : ''}

    ${trendChartImg ? `
      <h2 style="font-size:16px;font-weight:600;color:#5a6a8a;margin-bottom:12px;">📈 播放量趋势</h2>
      <div style="margin-bottom:32px;text-align:center;">
        <img src="${trendChartImg}" style="max-width:100%;border-radius:12px;" />
      </div>
    ` : ''}

    ${Object.keys(platformBreakdown).length > 0 ? `
      <h2 style="font-size:16px;font-weight:600;color:#5a6a8a;margin-bottom:12px;">📋 平台数据明细</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;font-size:13px;">
        <thead>
          <tr style="background:#f5f3f0;">
            <th style="text-align:left;padding:10px 12px;color:#8a8a9a;font-weight:500;">平台</th>
            <th style="text-align:right;padding:10px 12px;color:#8a8a9a;font-weight:500;">发布数</th>
            <th style="text-align:right;padding:10px 12px;color:#8a8a9a;font-weight:500;">总播放</th>
            <th style="text-align:right;padding:10px 12px;color:#8a8a9a;font-weight:500;">总点赞</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(platformBreakdown).map(([p, d]) => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 12px;">${PLATFORM_LABELS[p as Platform] || p}</td>
              <td style="text-align:right;padding:10px 12px;">${d.count}</td>
              <td style="text-align:right;padding:10px 12px;">${d.views.toLocaleString()}</td>
              <td style="text-align:right;padding:10px 12px;">${d.likes.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    ${topRecords.length > 0 ? `
      <h2 style="font-size:16px;font-weight:600;color:#5a6a8a;margin-bottom:12px;">🏆 播放量 TOP 10</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;font-size:13px;">
        <thead>
          <tr style="background:#f5f3f0;">
            <th style="text-align:left;padding:10px 12px;color:#8a8a9a;font-weight:500;width:40px;">#</th>
            <th style="text-align:left;padding:10px 12px;color:#8a8a9a;font-weight:500;">标题</th>
            <th style="text-align:left;padding:10px 12px;color:#8a8a9a;font-weight:500;">平台</th>
            <th style="text-align:right;padding:10px 12px;color:#8a8a9a;font-weight:500;">播放</th>
            <th style="text-align:right;padding:10px 12px;color:#8a8a9a;font-weight:500;">点赞</th>
          </tr>
        </thead>
        <tbody>
          ${topRecords.map((r, i) => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 12px;color:#8a8a9a;">${i + 1}</td>
              <td style="padding:10px 12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.title}</td>
              <td style="padding:10px 12px;">${PLATFORM_LABELS[r.platform]}</td>
              <td style="text-align:right;padding:10px 12px;font-weight:600;">${r.views.toLocaleString()}</td>
              <td style="text-align:right;padding:10px 12px;">${r.likes.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    ${insights.length > 0 ? `
      <h2 style="font-size:16px;font-weight:600;color:#5a6a8a;margin-bottom:12px;">✨ AI 智能洞察</h2>
      <div style="margin-bottom:32px;">
        ${insights.map(ins => `
          <div style="background:#f5f3f0;border-radius:10px;padding:14px 16px;margin-bottom:10px;">
            <div style="font-size:14px;font-weight:600;color:#1a1a2e;">${INSIGHT_EMOJI[ins.type] || '💡'} ${ins.title}</div>
            <div style="font-size:12px;color:#6a6a7a;margin-top:4px;">${ins.description}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div style="text-align:center;color:#bbb;font-size:11px;padding-top:16px;border-top:1px solid #eee;">
      由「短视频增长助手」生成 · ${dateStr}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`短视频数据报告_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
