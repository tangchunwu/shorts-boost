

## Plan: Enlarge Logo on Auth Page

The logo is currently `w-16 h-16` (64px) inside a `w-28 h-28` (112px) container on desktop, and `w-11 h-11` (44px) inside a `w-20 h-20` (80px) container on mobile. Both need to be significantly larger.

### Changes to `src/pages/Auth.tsx`:

1. **Desktop brand panel logo** (line 58-59): Increase container from `w-28 h-28` to `w-40 h-40`, logo from `w-16 h-16` to `w-28 h-28`, border radius to `rounded-[40px]`

2. **Mobile logo** (line 97-98): Increase container from `w-20 h-20` to `w-28 h-28`, logo from `w-11 h-11` to `w-16 h-16`, border radius to `rounded-[28px]`

