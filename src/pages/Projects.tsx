import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, ExternalLink, Github, Package, Image as ImageIcon, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import EmptyState from '@/components/EmptyState';

interface Project {
  id: string;
  name: string;
  year: number;
  url: string | null;
  tags: string[];
  description: string | null;
  github_url: string | null;
  npm_url: string | null;
  image_url: string | null;
}

function ProjectForm({ project, onSave, onCancel }: {
  project?: Project;
  onSave: (data: Omit<Project, 'id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(project?.name || '');
  const [year, setYear] = useState(project?.year || new Date().getFullYear());
  const [url, setUrl] = useState(project?.url || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(project?.tags || []);
  const [description, setDescription] = useState(project?.description || '');
  const [githubUrl, setGithubUrl] = useState(project?.github_url || '');
  const [npmUrl, setNpmUrl] = useState(project?.npm_url || '');
  const [imageUrl, setImageUrl] = useState(project?.image_url || '');

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('请输入项目名称'); return; }
    onSave({ name, year, url: url || null, tags, description: description || null, github_url: githubUrl || null, npm_url: npmUrl || null, image_url: imageUrl || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">项目名称 *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="例：短视频增长助手" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">年份</Label>
          <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2000} max={2099} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">项目链接</Label>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">标签</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="输入标签后按回车"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
          <Button type="button" variant="secondary" size="sm" onClick={addTag} className="shrink-0">添加</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(t => (
              <Badge key={t} variant="secondary" className="gap-1 pr-1">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">项目描述</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="简要介绍项目功能和特色..." rows={3} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Github className="h-3.5 w-3.5" /> GitHub</Label>
          <Input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/user/repo" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> NPM</Label>
          <Input value={npmUrl} onChange={e => setNpmUrl(e.target.value)} placeholder="https://npmjs.com/package/name" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> 封面图片 URL</Label>
        <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
        {imageUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-border bg-secondary/30 h-32 flex items-center justify-center">
            <img src={imageUrl} alt="preview" className="max-h-full max-w-full object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">{project ? '保存修改' : '添加项目'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </form>
  );
}

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="card-hover group overflow-hidden">
      {project.image_url && (
        <div className="h-40 bg-secondary/30 overflow-hidden">
          <img src={project.image_url} alt={project.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      )}
      <CardContent className={`p-5 ${project.image_url ? '' : 'pt-5'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-foreground">{project.name}</h3>
            <span className="text-xs text-muted-foreground">{project.year}</span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
          </div>
        </div>
        {project.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
          </div>
        )}
        <div className="flex gap-2">
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> 访问
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Github className="h-3 w-3" /> GitHub
            </a>
          )}
          {project.npm_url && (
            <a href={project.npm_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Package className="h-3 w-3" /> NPM
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('projects').select('*').eq('user_id', user.id).order('year', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user && !isGuest,
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<Project, 'id'>) => {
      const { error } = await supabase.from('projects').insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('项目已添加'); setDialogOpen(false); },
    onError: () => toast.error('添加失败'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Project) => {
      const { error } = await supabase.from('projects').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('已更新'); setDialogOpen(false); setEditingProject(undefined); },
    onError: () => toast.error('更新失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('已删除'); },
    onError: () => toast.error('删除失败'),
  });

  const handleSave = useCallback((data: Omit<Project, 'id'>) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, ...data });
    } else {
      addMutation.mutate(data);
    }
  }, [editingProject, addMutation, updateMutation]);

  const openEdit = (p: Project) => { setEditingProject(p); setDialogOpen(true); };
  const openNew = () => { setEditingProject(undefined); setDialogOpen(true); };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">项目展示</h1>
          <p className="text-muted-foreground text-sm mt-1">管理和展示你的作品集</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditingProject(undefined); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 添加项目</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? '编辑项目' : '添加项目'}</DialogTitle>
            </DialogHeader>
            <ProjectForm project={editingProject} onSave={handleSave} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isGuest && (
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4 text-sm text-muted-foreground">
            访客模式下无法保存项目数据，请登录后使用此功能。
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-60 animate-pulse bg-secondary/30" />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onEdit={() => openEdit(p)} onDelete={() => deleteMutation.mutate(p.id)} />
          ))}
        </div>
      ) : !isGuest ? (
        <EmptyState icon={FolderOpen} title="还没有项目" description="添加你的第一个项目，开始构建作品集 🎨" actionLabel="添加项目" onAction={openNew} />
      ) : null}
    </div>
  );
}
