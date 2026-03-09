import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Platform, PLATFORM_LABELS, PLATFORM_COLORS, CalendarEvent, PublishRecord } from '@/lib/types';
import { useCalendarEvents, useSaveCalendarEvent, useDeleteCalendarEvent, useSaveRecord } from '@/hooks/useCloudData';
import { Plus, ChevronLeft, ChevronRight, Trash2, Check, Calendar, ArrowRightCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import EmptyState from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuest } from '@/contexts/GuestContext';
import GuestPromptDialog from '@/components/GuestPromptDialog';

function ConvertToRecordDialog({ event, onDone }: { event: CalendarEvent; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState('0');
  const [likes, setLikes] = useState('0');
  const [comments, setComments] = useState('0');
  const [shares, setShares] = useState('0');
  const saveRecord = useSaveRecord();
  const saveEvent = useSaveCalendarEvent();

  const handleConvert = () => {
    const record: PublishRecord = {
      id: crypto.randomUUID(),
      title: event.title,
      platform: event.platform,
      publishedAt: event.date,
      views: parseInt(views) || 0,
      likes: parseInt(likes) || 0,
      comments: parseInt(comments) || 0,
      shares: parseInt(shares) || 0,
      tags: [],
      performance: 'normal',
      createdAt: new Date().toISOString(),
    };
    saveRecord.mutate(record, {
      onSuccess: () => {
        saveEvent.mutate({ ...event, status: 'published', recordId: record.id }, {
          onSuccess: () => {
            toast.success('已转为发布记录 📊');
            setOpen(false);
            onDone();
          },
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="转为发布记录">
          <ArrowRightCircle className="h-3.5 w-3.5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>转为发布记录</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">标题</Label>
            <p className="text-sm font-medium">{event.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label className="text-muted-foreground text-xs">平台</Label><p>{PLATFORM_LABELS[event.platform]}</p></div>
            <div><Label className="text-muted-foreground text-xs">日期</Label><p>{event.date}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label htmlFor="r-views">播放量</Label><Input id="r-views" type="number" min="0" value={views} onChange={e => setViews(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="r-likes">点赞数</Label><Input id="r-likes" type="number" min="0" value={likes} onChange={e => setLikes(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="r-comments">评论数</Label><Input id="r-comments" type="number" min="0" value={comments} onChange={e => setComments(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="r-shares">分享数</Label><Input id="r-shares" type="number" min="0" value={shares} onChange={e => setShares(e.target.value)} /></div>
          </div>
          <Button onClick={handleConvert} className="w-full" disabled={saveRecord.isPending || saveEvent.isPending}>
            <ArrowRightCircle className="h-4 w-4 mr-1" /> 保存为发布记录
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContentCalendar() {
  const { data: events = [], isLoading } = useCalendarEvents();
  const saveEventMutation = useSaveCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ title: '', platform: 'douyin' as Platform, date: '', status: 'planned' as 'planned' | 'published' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { isGuest } = useGuest();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

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

  const getEventsForDay = (date: Date) => events.filter(e => isSameDay(new Date(e.date), date));

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error('请输入标题'); return; }
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: form.title,
      platform: form.platform,
      date: form.date || selectedDate,
      status: form.status,
    };
    saveEventMutation.mutate(event, {
      onSuccess: () => {
        setForm({ title: '', platform: 'douyin', date: '', status: 'planned' });
        setOpen(false);
        toast.success('已添加到日历');
      },
    });
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteEventMutation.mutate(deleteTarget, {
      onSuccess: () => { setDeleteTarget(null); toast.success('已删除'); },
    });
  };

  const toggleStatus = (e: CalendarEvent) => {
    saveEventMutation.mutate({ ...e, status: e.status === 'planned' ? 'published' : 'planned' });
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const plannedEvents = events.filter(e => e.status === 'planned').sort((a, b) => a.date.localeCompare(b.date));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2"><Skeleton className="h-8 w-36" /><Skeleton className="h-4 w-52" /></div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">内容日历</h1>
          <p className="text-muted-foreground text-sm mt-1">管理发布节奏，规划内容排期</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundImage: 'var(--gradient-primary)' }}><Plus className="h-4 w-4 mr-1" /> 添加计划</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加内容计划</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label htmlFor="cal-title">视频标题</Label><Input id="cal-title" placeholder="输入视频标题" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>发布平台</Label><Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as Platform }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PLATFORM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="cal-date">发布日期</Label><Input id="cal-date" type="date" value={form.date || selectedDate} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>状态</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as 'planned' | 'published' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">计划中</SelectItem><SelectItem value="published">已发布</SelectItem></SelectContent></Select></div>
              <Button onClick={handleAdd} className="w-full" disabled={saveEventMutation.isPending}>保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-base">{format(currentMonth, 'yyyy年 M月')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px mb-1">
            {weekDays.map(d => <div key={d} className="text-center text-xs text-muted-foreground py-1.5 font-medium">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              return (
                <div key={i}
                  className={`min-h-[76px] p-1.5 rounded-lg border transition-all duration-200 cursor-pointer group ${today ? 'border-primary/60 bg-primary/5 shadow-sm' : 'border-border/50 hover:border-primary/30 hover:bg-secondary/40'} ${!inMonth ? 'opacity-25' : ''}`}
                  onClick={() => { setSelectedDate(format(day, 'yyyy-MM-dd')); setForm(f => ({ ...f, date: format(day, 'yyyy-MM-dd') })); setOpen(true); }}>
                  <div className={`text-xs font-medium mb-1 ${today ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {today ? <span className="inline-block w-5 h-5 rounded-full bg-primary text-primary-foreground text-center leading-5 text-[11px]">{format(day, 'd')}</span> : format(day, 'd')}
                  </div>
                  {dayEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} className="text-[10px] leading-tight truncate px-1.5 py-0.5 rounded-md mb-0.5 cursor-pointer transition-opacity hover:opacity-80 flex items-center gap-0.5"
                      style={{ backgroundColor: `${PLATFORM_COLORS[ev.platform]}18`, color: PLATFORM_COLORS[ev.platform], borderLeft: `2px solid ${PLATFORM_COLORS[ev.platform]}` }}
                      onClick={e => { e.stopPropagation(); toggleStatus(ev); }}>
                      {ev.status === 'published' && <Check className="inline h-2.5 w-2.5 shrink-0" />}
                      {ev.recordId && <Link2 className="inline h-2.5 w-2.5 shrink-0" />}
                      <span className="truncate">{ev.title.slice(0, 6)}</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {plannedEvents.length > 0 ? (
        <Card className="animate-fade-in-up animate-stagger-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">待发布计划</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {plannedEvents.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 transition-colors hover:bg-secondary/30 rounded px-2 -mx-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[e.platform] }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground"><span style={{ color: PLATFORM_COLORS[e.platform] }}>{PLATFORM_LABELS[e.platform]}</span> · {e.date}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <ConvertToRecordDialog event={e} onDone={() => {}} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(e)}><Check className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <EmptyState icon={Calendar} title="还没有内容计划" description="点击日历格子或「添加计划」开始规划你的发布节奏 📅" />
      ) : null}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>删除后无法恢复，确定要删除这条计划吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GuestPromptDialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt} featureName="转为发布记录" />
    </div>
  );
}
