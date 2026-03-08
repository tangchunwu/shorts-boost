import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Platform, PLATFORM_LABELS, PLATFORM_COLORS, CalendarEvent } from '@/lib/types';
import { getCalendarEvents, saveCalendarEvent, deleteCalendarEvent } from '@/lib/storage';
import { Plus, ChevronLeft, ChevronRight, Trash2, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import EmptyState from '@/components/EmptyState';

export default function ContentCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => getCalendarEvents());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ title: '', platform: 'douyin' as Platform, date: '', status: 'planned' as 'planned' | 'published' });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const startDay = start.getDay() || 7;
    const padBefore = Array.from({ length: startDay - 1 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - (startDay - 1 - i));
      return d;
    });
    return [...padBefore, ...allDays];
  }, [currentMonth]);

  const getEventsForDay = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.date), date));

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error('请输入标题'); return; }
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: form.title,
      platform: form.platform,
      date: form.date || selectedDate,
      status: form.status,
    };
    saveCalendarEvent(event);
    setEvents(getCalendarEvents());
    setForm({ title: '', platform: 'douyin', date: '', status: 'planned' });
    setOpen(false);
    toast.success('已添加到日历');
  };

  const handleDelete = (id: string) => {
    deleteCalendarEvent(id);
    setEvents(getCalendarEvents());
  };

  const toggleStatus = (e: CalendarEvent) => {
    const updated = { ...e, status: e.status === 'planned' ? 'published' as const : 'planned' as const };
    saveCalendarEvent(updated);
    setEvents(getCalendarEvents());
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const plannedEvents = events.filter(e => e.status === 'planned').sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">内容日历</h1>
          <p className="text-muted-foreground text-sm mt-1">管理发布节奏，规划内容排期</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundImage: 'var(--gradient-primary)' }}>
              <Plus className="h-4 w-4 mr-1" /> 添加计划
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加内容计划</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="cal-title">视频标题</Label>
                <Input id="cal-title" placeholder="输入视频标题" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>发布平台</Label>
                  <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as Platform }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cal-date">发布日期</Label>
                  <Input id="cal-date" type="date" value={form.date || selectedDate} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as 'planned' | 'published' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">计划中</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full">保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base">{format(currentMonth, 'yyyy年 M月')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1.5 font-medium">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              return (
                <div
                  key={i}
                  className={`min-h-[76px] p-1.5 rounded-lg border transition-all duration-200 cursor-pointer group ${
                    today
                      ? 'border-primary/60 bg-primary/5 shadow-sm'
                      : 'border-border/50 hover:border-primary/30 hover:bg-secondary/40'
                  } ${!inMonth ? 'opacity-25' : ''}`}
                  onClick={() => {
                    setSelectedDate(format(day, 'yyyy-MM-dd'));
                    setForm(f => ({ ...f, date: format(day, 'yyyy-MM-dd') }));
                    setOpen(true);
                  }}
                >
                  <div className={`text-xs font-medium mb-1 ${today ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {today && <span className="inline-block w-5 h-5 rounded-full bg-primary text-primary-foreground text-center leading-5 text-[11px]">{format(day, 'd')}</span>}
                    {!today && format(day, 'd')}
                  </div>
                  {dayEvents.slice(0, 2).map(ev => (
                    <div
                      key={ev.id}
                      className="text-[10px] leading-tight truncate px-1.5 py-0.5 rounded-md mb-0.5 cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: `${PLATFORM_COLORS[ev.platform]}18`,
                        color: PLATFORM_COLORS[ev.platform],
                        borderLeft: `2px solid ${PLATFORM_COLORS[ev.platform]}`,
                      }}
                      onClick={e => { e.stopPropagation(); toggleStatus(ev); }}
                    >
                      {ev.status === 'published' && <Check className="inline h-2.5 w-2.5 mr-0.5" />}
                      {ev.title.slice(0, 6)}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events list */}
      {plannedEvents.length > 0 ? (
        <Card className="animate-fade-in-up animate-stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">待发布计划</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plannedEvents.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 transition-colors hover:bg-secondary/30 rounded px-2 -mx-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PLATFORM_COLORS[e.platform] }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span style={{ color: PLATFORM_COLORS[e.platform] }}>{PLATFORM_LABELS[e.platform]}</span> · {e.date}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(e)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="还没有内容计划"
          description="点击日历格子或「添加计划」开始规划你的发布节奏 📅"
        />
      ) : null}
    </div>
  );
}
