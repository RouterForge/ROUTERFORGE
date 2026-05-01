'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowUp,
  Plus,
  Trash2,
  Pencil,
  Search,
  Download,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODELS, MODEL_FAMILIES, type ModelFamilyId } from '@/lib/models';
import { cn, shortId } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  updatedAt: number;
}

const STORAGE_KEY = 'routerforge:chat:v1';

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveConversations(c: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

export function ChatView() {
  const t = useTranslations('chat');
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [model, setModel] = React.useState(MODELS[0].id);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const initial = loadConversations();
    setConversations(initial);
    if (initial[0]) setActiveId(initial[0].id);
  }, []);

  React.useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const filtered = conversations
    .filter(
      (c) =>
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  function newConversation() {
    const c: Conversation = {
      id: shortId(),
      title: 'New chat',
      modelId: model,
      messages: [],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  }

  function deleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  }

  function renameConversation(id: string) {
    const next = window.prompt('Rename conversation', conversations.find((c) => c.id === id)?.title);
    if (!next) return;
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: next } : c)));
  }

  function exportMd() {
    if (!active) return;
    const md =
      `# ${active.title}\n\n` +
      active.messages
        .map((m) => (m.role === 'user' ? `**You:** ${m.content}` : `**Assistant:** ${m.content}`))
        .join('\n\n');
    download(md, `${active.title}.md`, 'text/markdown');
  }

  function exportJson() {
    if (!active) return;
    download(JSON.stringify(active, null, 2), `${active.title}.json`, 'application/json');
  }

  async function send(content: string) {
    if (!content.trim()) return;
    let convo = active;
    if (!convo) {
      convo = {
        id: shortId(),
        title: content.slice(0, 40) + (content.length > 40 ? '…' : ''),
        modelId: model,
        messages: [],
        updatedAt: Date.now(),
      };
      setConversations((prev) => [convo!, ...prev]);
      setActiveId(convo.id);
    }
    const next: Conversation = {
      ...convo,
      title: convo.messages.length === 0 ? content.slice(0, 40) : convo.title,
      messages: [...convo.messages, { role: 'user', content }, { role: 'assistant', content: '' }],
      updatedAt: Date.now(),
    };
    setConversations((prev) => prev.map((c) => (c.id === convo!.id ? next : c)));
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          modelId: model,
          messages: next.messages.slice(0, -1),
        }),
      });
      if (!res.ok || !res.body) {
        toast.error('Chat failed');
        setBusy(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== next.id) return c;
            const msgs = [...c.messages];
            msgs[msgs.length - 1] = { role: 'assistant', content: acc };
            return { ...c, messages: msgs, updatedAt: Date.now() };
          }),
        );
      }
    } catch (e: any) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages.length]);

  const grouped = React.useMemo(() => {
    const out: Record<ModelFamilyId, typeof MODELS> = {
      openai: [],
      claude: [],
      gemini: [],
      oss: [],
    };
    for (const m of MODELS) out[m.family].push(m);
    return out;
  }, []);

  const suggestions = ['one', 'two', 'three', 'four'] as const;

  return (
    <div className="grid gap-0 lg:grid-cols-[280px_1fr] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 h-[calc(100dvh-3.5rem)]">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col border-e border-border/60 bg-card/40">
        <div className="p-3 border-b border-border/60 space-y-2">
          <Button onClick={newConversation} variant="gradient" className="w-full">
            <Plus className="h-4 w-4" /> {t('newChat')}
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchConversations')}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t('noConversations')}
            </div>
          )}
          <div className="p-2 space-y-1">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  'group rounded-lg p-3 text-sm cursor-pointer transition-colors',
                  c.id === activeId
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.messages[c.messages.length - 1]?.content?.slice(0, 60) ?? '—'}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => renameConversation(c.id)}>
                        <Pencil className="h-3 w-3" /> {t('rename')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteConversation(c.id)}>
                        <Trash2 className="h-3 w-3" /> {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 p-3 bg-background">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <div className="font-medium truncate">{active?.title ?? t('newChat')}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-48 hidden sm:block">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(grouped) as ModelFamilyId[]).map((fam) => (
                    <SelectGroup key={fam}>
                      <SelectLabel>{MODEL_FAMILIES[fam].label}</SelectLabel>
                      {grouped[fam].map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={exportMd} disabled={!active}>
              <Download className="h-4 w-4" /> .md
            </Button>
            <Button variant="ghost" size="sm" onClick={exportJson} disabled={!active}>
              <Download className="h-4 w-4" /> .json
            </Button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {!active || active.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">RouterForge Chat</h2>
              <p className="mt-2 text-muted-foreground">
                Pick a model and start a conversation. Try one of these:
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {suggestions.map((k) => (
                  <button
                    key={k}
                    onClick={() => send(t(`suggestions.${k}` as any))}
                    className="rounded-lg border border-border/60 bg-card p-4 text-start text-sm hover:border-primary/40 transition-colors"
                  >
                    {t(`suggestions.${k}` as any)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {active.messages.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className={cn(
                      'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs',
                      m.role === 'user'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'gradient-brand text-white',
                    )}
                  >
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {m.role === 'user' ? 'You' : MODELS.find((mm) => mm.id === active.modelId)?.label ?? active.modelId}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:font-mono">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content || (m.role === 'assistant' && busy ? '…' : '')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-background p-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card p-2 focus-within:border-primary/40 transition-colors">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={t('messagePlaceholder')}
                rows={1}
                className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[2.25rem]"
              />
              <Button
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                size="icon"
                variant="gradient"
                className="shrink-0 h-9 w-9"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <Badge variant="soft">
                {MODELS.find((m) => m.id === model)?.label ?? model}
              </Badge>
              <span>Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function download(content: string, name: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
