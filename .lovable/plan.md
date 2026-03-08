

## Plan: Workflow Integration -- SEO Analysis → Calendar → Records

### Goal
Create a closed-loop workflow: SEO analysis results can be sent to the Content Calendar with one click, and Calendar events can be converted to Publish Records with one click.

### Changes

#### 1. SEO Analysis → Calendar (Analyze.tsx)
- Add a "加入日历" (Add to Calendar) button next to each recommended title in `ResultDisplay`
- Clicking it opens a small dialog/popover to pick a date, then creates a `CalendarEvent` with the selected title, current platform, chosen date, and status "planned"
- Uses the existing `useSaveCalendarEvent` hook
- Also add the button in history expanded view

#### 2. Calendar → Record (ContentCalendar.tsx)  
- In the "待发布计划" list and calendar event click, add a "转为记录" (Convert to Record) button for planned/published events
- Clicking opens a dialog pre-filled with title, platform, and date from the event, plus empty fields for views/likes/comments/shares
- On save, creates a `PublishRecord` via `useSaveRecord`, updates the calendar event status to "published" and links `recordId`
- Uses existing hooks from `useCloudData`

#### 3. Component Structure
- Extract a reusable `AddToCalendarButton` component (inline in Analyze.tsx) that takes title + platform, shows a date picker popover, and saves
- Extract a `ConvertToRecordDialog` component (inline in ContentCalendar.tsx) that takes a `CalendarEvent` and creates a record

#### 4. Visual Flow Indicators
- In Calendar, show a link icon on events that have a linked `recordId`
- Toast confirmations with navigation hints (e.g., "已添加到日历，去内容日历查看")

### Files to Edit
1. **src/pages/Analyze.tsx** -- Add "加入日历" button to each recommended title in ResultDisplay, with date picker popover
2. **src/pages/ContentCalendar.tsx** -- Add "转为记录" button/dialog for calendar events, pre-fill record form
3. No database changes needed -- existing schema already supports `recordId` on `calendar_events`

