import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const ONBOARDING_KEY = 'onboarding_completed';

export function useOnboarding() {
  const navigate = useNavigate();

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.55)',
      stagePadding: 8,
      stageRadius: 16,
      popoverClass: 'onboarding-popover',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '开始使用 🚀',
      progressText: '{{current}} / {{total}}',
      steps: [
        {
          element: '#tour-quick-actions',
          popover: {
            title: '🚀 快速操作',
            description: '从这里可以快速进入 SEO 分析或添加发布记录，是你最常用的两个入口',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-nav-analyze',
          popover: {
            title: '🔍 SEO 分析',
            description: '输入视频标题，AI 为你生成优化方案、关键词推荐和评分。支持批量标题对比！',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-records',
          popover: {
            title: '📝 发布记录',
            description: '记录每条视频的数据表现，追踪播放量、点赞、评论等指标',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-trending',
          popover: {
            title: '🔥 热门话题',
            description: '发现各平台热门话题趋势，一键生成优化标题',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-competitors',
          popover: {
            title: '👥 竞品监控',
            description: '记录竞品视频数据，AI 对比分析帮你发现差距和机会',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-calendar',
          popover: {
            title: '📅 内容日历',
            description: '规划发布计划，管理内容排期，不再错过最佳发布时间',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-theme-toggle',
          popover: {
            title: '🌗 主题切换',
            description: '支持浅色和深色模式，保护你的眼睛',
            side: 'right',
            align: 'end',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
      },
    });

    driverObj.drive();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      // Wait for DOM to render
      const timer = setTimeout(() => {
        // Only start on desktop where sidebar nav is visible
        const navEl = document.getElementById('tour-nav-analyze');
        if (navEl) {
          startTour();
        } else {
          // On mobile, just mark as done (sidebar not visible)
          localStorage.setItem(ONBOARDING_KEY, 'true');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return { startTour };
}
