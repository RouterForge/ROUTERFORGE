'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { startOAuthAction } from '@/app/[locale]/(admin)/admin/cliproxy/actions';

type Provider = 'anthropic' | 'codex' | 'gemini-cli' | 'antigravity' | 'kimi';

const LABELS: Record<Provider, string> = {
  anthropic: 'Anthropic',
  codex: 'OpenAI Codex',
  'gemini-cli': 'Gemini CLI',
  antigravity: 'Antigravity',
  kimi: 'Kimi',
};

/**
 * Launches an OAuth flow for a CLIProxyAPI-supported provider.
 *
 * Flow:
 *   1. Call the server action which fetches the hosted auth URL from
 *      CLIProxyAPI Plus (`/v0/management/<provider>-auth-url`).
 *   2. Open that URL in a new tab so the super-admin can sign in with
 *      their provider account.
 *   3. After the provider redirects back to CLIProxyAPI (which persists
 *      the auth file), we refresh the page so the new account appears
 *      in the OAuth accounts table.
 */
export function OAuthConnectButton({
  provider,
  disabled,
}: {
  provider: Provider;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function connect() {
    setBusy(true);
    try {
      const res = await startOAuthAction(provider);
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        toast.success(`Opened ${LABELS[provider]} OAuth — complete it in the new tab`, {
          description:
            "When you're done, this page will automatically refresh to show the new account.",
        });
        // Poll for new auth files by refreshing shortly — the backend
        // will have written the auth file once the user finishes OAuth.
        setTimeout(() => router.refresh(), 8_000);
        setTimeout(() => router.refresh(), 20_000);
      } else {
        toast.error(res.error ?? 'Could not start OAuth');
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={connect}
      disabled={disabled || busy}
      className="gap-1"
    >
      <Plus className="h-4 w-4" />
      {LABELS[provider]}
    </Button>
  );
}
