# 📈 短视频增长助手

> 一站式短视频 SEO 优化与数据分析平台，助力创作者提升流量、优化标题、追踪竞品。

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## ✨ 核心功能

### 🎯 SEO 智能分析
- 输入视频标题和脚本，AI 生成优化建议、关键词推荐和最佳发布时间
- 多维度标题评分（吸引力、关键词密度、平台适配度、字数合理性）
- 标题模板库，一键套用高转化标题结构

### 📊 数据仪表盘
- 可视化展示播放量、点赞、评论、分享等关键指标趋势
- 月度目标设定与达成率追踪，含历史目标回顾
- AI 智能洞察，自动发现数据规律

### 🔥 热门话题发现
- 跨平台热门话题聚合（抖音、快手、小红书、B站）
- 趋势分析与内容灵感推荐

### 📅 内容日历
- 可视化内容排期管理
- 计划发布与已发布状态追踪
- 与发布记录自动关联

### 👥 竞品监控
- 添加竞品账号视频数据，对比分析表现
- AI 生成竞品分析报告
- 多维度数据对比图表

### 📋 发布记录管理
- 完整的视频发布记录 CRUD
- CSV 批量导入导出
- AI 批量审核与合规检查
- 定期数据报告生成

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | React 18 + TypeScript |
| **构建工具** | Vite 5 |
| **样式方案** | Tailwind CSS + shadcn/ui |
| **状态管理** | TanStack React Query |
| **路由** | React Router v6 |
| **图表** | Recharts |
| **后端** | Lovable Cloud (Supabase) |
| **AI 能力** | Lovable AI Gateway |
| **PDF 导出** | jsPDF + html2canvas |

---

## 🚀 快速开始

```bash
# 克隆项目
git clone <YOUR_GIT_URL>

# 进入项目目录
cd <YOUR_PROJECT_NAME>

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📁 项目结构

```
src/
├── components/          # UI 组件
│   ├── ui/              # shadcn/ui 基础组件
│   ├── AppLayout.tsx    # 应用布局（侧边栏 + 底部导航）
│   ├── GoalCard.tsx     # 目标追踪卡片
│   ├── AIInsightsCard.tsx # AI 洞察卡片
│   └── ...
├── pages/               # 页面路由
│   ├── Dashboard.tsx    # 仪表盘
│   ├── Analyze.tsx      # SEO 分析
│   ├── Records.tsx      # 发布记录
│   ├── ContentCalendar.tsx # 内容日历
│   ├── TrendingTopics.tsx  # 热门话题
│   └── CompetitorMonitor.tsx # 竞品监控
├── hooks/               # 自定义 Hooks
├── contexts/            # React Context（认证、访客模式）
├── lib/                 # 工具函数与类型定义
└── integrations/        # 后端集成

supabase/
└── functions/           # 后端函数
    ├── analyze-seo/     # SEO 分析
    ├── ai-insights/     # AI 洞察
    ├── trending-topics/ # 热门话题
    └── ...
```

---

## 🔑 主要特性

- 🌓 **深色/浅色模式** — 一键切换，偏好自动保存
- 👤 **访客模式** — 无需注册即可体验全部功能
- 📱 **响应式设计** — 完美适配桌面端与移动端
- ⌨️ **键盘快捷键** — `Ctrl+N` 新建分析，`Ctrl+K` 全局搜索
- 💾 **数据备份/恢复** — 支持 JSON 格式导入导出
- 🔒 **用户认证** — 邮箱注册登录，数据云端同步

---

## 📄 许可证

MIT License
