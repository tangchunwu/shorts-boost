import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TITLE_TEMPLATES, TEMPLATE_CATEGORIES, TitleTemplate } from '@/lib/titleTemplates';
import { Platform, PLATFORM_LABELS } from '@/lib/types';
import { Wand2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TitleTemplatesProps {
  platform: Platform;
  onApply: (template: string) => void;
}

export default function TitleTemplates({ platform, onApply }: TitleTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = TITLE_TEMPLATES.filter(t => {
    const matchesPlatform = t.platforms.includes(platform);
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesPlatform && matchesCategory;
  });

  const handleCopy = (template: TitleTemplate) => {
    navigator.clipboard.writeText(template.template);
    setCopiedId(template.id);
    toast.success('模板已复制');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (template: TitleTemplate) => {
    onApply(template.template);
    toast.success('模板已填入，请替换括号中的内容');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          爆款标题模板
          <Badge variant="secondary" className="ml-auto text-xs">{PLATFORM_LABELS[platform]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedCategory(null)}
          >
            全部
          </Button>
          {TEMPLATE_CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </Button>
          ))}
        </div>

        {/* Templates list */}
        <ScrollArea className="h-64">
          <div className="space-y-2 pr-3">
            {filteredTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                该平台暂无此分类模板
              </p>
            ) : (
              filteredTemplates.map(template => {
                const category = TEMPLATE_CATEGORIES.find(c => c.id === template.category);
                return (
                  <div
                    key={template.id}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{category?.icon}</span>
                          <span className="text-sm font-medium">{template.template}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          例：{template.example}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(template)}
                          title="复制模板"
                        >
                          {copiedId === template.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleApply(template)}
                          title="填入分析器"
                        >
                          <Wand2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground">
          💡 点击魔法棒将模板填入分析器，替换 {'{}'} 中的内容即可
        </p>
      </CardContent>
    </Card>
  );
}
