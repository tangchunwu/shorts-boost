

## Plan: 全局莫兰迪色系改造

莫兰迪色系特点：低饱和度、灰调柔和、高级感。将当前高饱和度的紫色/粉色主题替换为莫兰迪风格的柔和色调。

### 修改文件

**`src/index.css`** — 替换 CSS 变量中的所有颜色值

#### Light Mode 莫兰迪配色：
- **Primary**: 灰蓝调（如 `220 25% 55%`）— 低饱和蓝灰
- **Accent**: 灰粉调（如 `350 20% 65%`）— 柔和玫瑰灰
- **Background**: 暖灰白（如 `30 15% 96%`）
- **Card**: 纯白略带暖调
- **Success**: 灰绿（如 `150 20% 50%`）
- **Warning**: 灰橙（如 `35 30% 55%`）
- **Destructive**: 灰红（如 `0 25% 55%`）
- **Border/Input**: 柔和灰（如 `30 10% 88%`）
- **Muted**: 暖灰
- **Gradient**: 改为低饱和渐变

#### Dark Mode 莫兰迪配色：
- 同样降低饱和度，保持灰调深色背景
- 前景色保持高可读性

#### Sidebar 颜色：
- 跟随主色系调整

### 同步修改

**`src/pages/Analyze.tsx`** 和 **`src/pages/ContentCalendar.tsx`** 等页面中如有 `style={{ backgroundImage: 'var(--gradient-primary)' }}` 的内联样式，无需改动（跟随 CSS 变量自动生效）。

**`src/lib/types.ts`** — 平台颜色 `PLATFORM_COLORS` 也改为莫兰迪色调：
- 抖音：灰粉 `hsl(350, 22%, 62%)`
- 快手：灰橙 `hsl(25, 28%, 58%)`
- 小红书：灰红 `hsl(0, 22%, 58%)`
- B站：灰蓝 `hsl(200, 25%, 55%)`

