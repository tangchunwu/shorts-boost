

## Plan: 优化登录页图标

用户指出登录页顶部的 `📈` emoji 图标显示为碎图（系统不支持该 emoji 渲染），需要替换。

### 修改方案

**`src/pages/Auth.tsx`** — 将 `<div className="text-3xl mb-2">📈</div>` 替换为 Lucide 图标组合（如 `TrendingUp` 或 `BarChart3`），使用莫兰迪主色渲染，与整体设计语言一致。

具体实现：用 `lucide-react` 的 `TrendingUp` 图标，包裹在一个带莫兰迪色背景的圆形容器中，形成精致的 Logo 效果。

