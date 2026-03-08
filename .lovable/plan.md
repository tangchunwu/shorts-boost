

# UI/UX 优化计划

## 当前问题分析

1. **Dashboard 空状态体验差** — 全是 0，缺少引导感和视觉层次
2. **侧边栏过于朴素** — 缺少分隔线、图标颜色区分、Logo 样式单薄
3. **卡片缺少微交互** — 没有 hover 效果、没有入场动画
4. **空状态页面单调** — 纯文字，缺少插图/图标引导
5. **表单对话框体验一般** — 没有分组、没有标签说明
6. **日历页面视觉层次不够** — 格子太平，缺少今日高亮和事件预览的对比度
7. **移动端底部导航缺少当前页指示器**
8. **整体缺少过渡动画** — 页面切换、卡片出现都是瞬间的

---

## 优化内容

### 1. 全局动画与过渡
- 在 `tailwind.config.ts` 添加 `fade-in`、`slide-up` 关键帧动画
- 在 `index.css` 添加 `.animate-fade-in-up` 工具类
- 所有页面主容器添加入场动画
- 卡片添加 `hover:shadow-md hover:-translate-y-0.5 transition-all` 效果

### 2. 侧边栏优化 (AppLayout.tsx)
- Logo 区域加分隔线，增大间距
- 导航项添加 hover 时的图标颜色变化
- 活跃项添加左侧指示条（`before:` 伪元素或 border-left）
- 底部主题切换按钮加分隔线
- 移动端底部栏添加活跃指示点

### 3. Dashboard 优化
- 空状态使用大图标 + 分步引导卡片（"第一步：分析标题 → 第二步：记录数据 → 第三步：AI 复盘"）
- 统计卡片添加图标背景色圈、hover 放大效果
- 快捷操作卡片增加图标背景和更好的视觉层次

### 4. SEO 分析页优化
- 输入区域添加 label 标签
- 结果卡片添加交错入场动画
- 历史记录列表添加过渡效果

### 5. 发布记录页优化
- 空状态添加引导图标和 CTA
- 记录卡片增强 hover 效果
- 添加记录对话框中的 Input 添加标签（Label）
- 工具栏按钮组优化间距和视觉层次

### 6. 内容日历优化
- 日历格子添加更明显的 hover 效果
- 今日单元格增强视觉（加粗边框 + 背景色）
- 事件标签增大可点击区域
- 待发布列表添加平台色标

### 7. 通用改进
- 所有 `Card` 组件统一添加 `hover:shadow-sm transition-shadow`
- 空状态组件抽取为可复用组件 `EmptyState`
- 页面标题区域统一添加底部分隔或渐变装饰线

---

## 涉及文件

| 文件 | 改动 |
|------|------|
| `tailwind.config.ts` | 添加自定义动画关键帧 |
| `src/index.css` | 添加动画工具类、全局过渡 |
| `src/components/AppLayout.tsx` | 侧边栏视觉升级、移动端优化 |
| `src/components/EmptyState.tsx` | 新建可复用空状态组件 |
| `src/pages/Dashboard.tsx` | 空状态引导、卡片动效 |
| `src/pages/Analyze.tsx` | 标签、动画、历史列表优化 |
| `src/pages/Records.tsx` | 表单标签、空状态、卡片动效 |
| `src/pages/ContentCalendar.tsx` | 日历格子、事件标签视觉优化 |

