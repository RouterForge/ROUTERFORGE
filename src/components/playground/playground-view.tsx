'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Play, Square, Copy, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MODELS, MODEL_FAMILIES, type ModelFamilyId } from '@/lib/models';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export function PlaygroundView() {
  const t = useTranslations('playground');
  const [model, setModel] = React.useState(MODELS[0].id);
  const [system, setSystem] = React.useState('You are a helpful assistant.');
  const [user, setUser] = React.useState('Explain how HTTP/2 differs from HTTP/1.1.');
  const [temperature, setTemperature] = React.useState(0.7);
  const [topP, setTopP] = React.useState(1);
  const [maxTokens, setMaxTokens] = React.useState(1024);
  const [streaming, setStreaming] = React.useState(true);
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [latency, setLatency] = React.useState<number | null>(null);
  const [tokens, setTokens] = React.useState<{ in: number; out: number } | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const tokenEstimate = React.useMemo(
    () => Math.ceil((system.length + user.length) / 4),
    [system, user],
  );

  async function run() {
    if (!user.trim()) return;
    setBusy(true);
    setLatency(null);
    setTokens(null);
    const start = Date.now();
    abortRef.current = new AbortController();
    setMessages((prev) => [...prev, { role: 'user', content: user }]);
    try {
      const res = await fetch('/api/playground/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          modelId: model,
          system,
          user,
          temperature,
          topP,
          maxTokens,
          stream: streaming,
        }),
      });
      if (!res.ok || !res.body) {
        toast.error('Run failed');
        setBusy(false);
        return;
      }

      if (!streaming) {
        const data = await res.json();
        setMessages((m) => [...m, { role: 'assistant', content: data.text }]);
        setLatency(Date.now() - start);
        setTokens({
          in: data.usage?.promptTokens ?? 0,
          out: data.usage?.completionTokens ?? 0,
        });
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        setMessages((m) => [...m, { role: 'assistant', content: '' }]);
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          acc += chunk;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: acc };
            return copy;
          });
        }
        setLatency(Date.now() - start);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error(String(e));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setBusy(false);
  }

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

  const snippets = makeSnippets({ model, system, user, temperature, topP, maxTokens, streaming });

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      {/* CONTROLS */}
      <Card className="p-5 space-y-4 self-start">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{t('title')}</div>
          <Badge variant="soft">{t('subtitle')}</Badge>
        </div>

        <div className="space-y-2">
          <Label>{t('model')}</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
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

        <div className="space-y-2">
          <Label htmlFor="system">{t('systemPrompt')}</Label>
          <Textarea
            id="system"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('temperature')}</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{temperature.toFixed(2)}</span>
          </div>
          <Slider
            min={0}
            max={2}
            step={0.05}
            value={[temperature]}
            onValueChange={([v]) => setTemperature(v)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('topP')}</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{topP.toFixed(2)}</span>
          </div>
          <Slider min={0} max={1} step={0.05} value={[topP]} onValueChange={([v]) => setTopP(v)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('maxTokens')}</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{maxTokens}</span>
          </div>
          <Slider
            min={64}
            max={8192}
            step={64}
            value={[maxTokens]}
            onValueChange={([v]) => setMaxTokens(v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="stream">{t('streaming')}</Label>
          <Switch id="stream" checked={streaming} onCheckedChange={setStreaming} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <Save className="h-4 w-4" /> {t('savePreset')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <Sparkles className="h-4 w-4" /> {t('compareMode')}
          </Button>
        </div>
      </Card>

      {/* WORKSPACE */}
      <div className="space-y-4 min-w-0">
        <Card className="p-5">
          <Label htmlFor="user">{t('userPrompt')}</Label>
          <Textarea
            id="user"
            className="mt-2"
            rows={4}
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder={t('placeholder')}
          />
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {!busy ? (
              <Button onClick={run} variant="gradient">
                <Play className="h-4 w-4" /> {t('run')}
              </Button>
            ) : (
              <Button onClick={stop} variant="destructive">
                <Square className="h-4 w-4" /> {t('stop')}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              ~{tokenEstimate} {t('tokens')}
            </span>
            {latency !== null && (
              <span className="text-xs text-muted-foreground ms-auto">
                {t('latency')}: {latency} ms
              </span>
            )}
            {tokens && (
              <span className="text-xs text-muted-foreground">
                {tokens.in} in / {tokens.out} out
              </span>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-medium mb-3">{t('response')}</div>
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground text-center">
              Run a prompt to see the response.
            </div>
          ) : (
            <div className="space-y-3 max-h-[40rem] overflow-y-auto scrollbar-thin pr-1">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === 'user'
                      ? 'rounded-lg border border-border/60 bg-card p-3'
                      : 'rounded-lg border border-primary/30 bg-primary/5 p-3'
                  }
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {m.role}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {m.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="font-semibold mb-3">{t('snippets')}</div>
          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="js">JavaScript</TabsTrigger>
              <TabsTrigger value="py">Python</TabsTrigger>
            </TabsList>
            {(['curl', 'js', 'py'] as const).map((k) => (
              <TabsContent key={k} value={k} className="mt-3">
                <div className="relative group">
                  <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                    <code>{snippets[k]}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      navigator.clipboard.writeText(snippets[k]);
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function makeSnippets(opts: {
  model: string;
  system: string;
  user: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  streaming: boolean;
}) {
  const body = {
    model: opts.model,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    temperature: opts.temperature,
    top_p: opts.topP,
    max_tokens: opts.maxTokens,
    stream: opts.streaming,
  };
  const json = JSON.stringify(body, null, 2);
  return {
    curl: `curl https://api.routerforge.example/v1/chat/completions \\
  -H "Authorization: Bearer $ROUTERFORGE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${json.replace(/'/g, "'\\''")}'`,
    js: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.routerforge.example/v1",
  apiKey: process.env.ROUTERFORGE_API_KEY,
});

const res = await client.chat.completions.create(${json});
console.log(res.choices[0].message);`,
    py: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.routerforge.example/v1",
    api_key=os.environ["ROUTERFORGE_API_KEY"],
)

res = client.chat.completions.create(**${json})
print(res.choices[0].message)`,
  };
}
