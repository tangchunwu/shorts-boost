

## Product Optimization Plan

Based on a thorough review of the current codebase and UI, here are the key areas to improve:

### 1. Guest Mode Completeness
- Add guest restriction prompts to **AI Insights** (Dashboard) and **Competitor Compare** (Dashboard) — currently these AI features are not gated for guests
- Add guest restriction to **Calendar's convert-to-record** action

### 2. Records Page — Search & Filter
- Add a search input to filter records by title or tags
- Add platform filter chips (similar to Dashboard) to narrow records
- Add sort options (by date, views, likes)

### 3. Dashboard — Welcome & Onboarding
- Show a personalized greeting with time-of-day awareness (e.g. "早上好" / "下午好")
- Display user email or username in the header area

### 4. Loading Skeleton States
- Replace spinner loading states with skeleton placeholders on Dashboard cards, Records list, and Calendar grid for a more polished feel

### 5. Mobile UX Improvements
- Add a mobile header bar with the app logo and dark mode toggle (currently only accessible via desktop sidebar)
- Add swipe gesture hint on calendar for month navigation

### 6. Data Validation & Error Handling
- Prevent negative numbers in record form inputs (views, likes, comments, shares)
- Add form validation feedback with inline error messages instead of just toasts
- Confirm before deleting records (currently deletes immediately)

### Technical Implementation Details

**Guest restrictions** — Reuse the existing `GuestPromptDialog` component and `useGuest` hook pattern already established in Analyze and Records pages. Add the same pattern to `AIInsightsCard.tsx` and `CompetitorCompare.tsx`.

**Search & filter on Records** — Add `useState` for search term and platform filter, then apply `useMemo` filtering on the records array before rendering. No database changes needed.

**Skeleton states** — Use the existing `Skeleton` component from `src/components/ui/skeleton.tsx` to build placeholder layouts matching the card structure.

**Delete confirmation** — Use the existing `AlertDialog` component to wrap the delete action.

**Mobile header** — Add a top bar inside `AppLayout.tsx` visible only on `md:hidden` screens, containing the logo, title, and dark mode toggle.

No database migrations are required for any of these changes.

