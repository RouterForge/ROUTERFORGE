import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { getSessionUser } from '@/lib/auth';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'settings' });
  const user = await getSessionUser().catch(() => null);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">Manage your profile, security, and preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('security')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('preferences')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('notifications')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input defaultValue={user?.name ?? ''} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue={user?.email ?? ''} type="email" disabled={!!user?.email} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="gradient">Save</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Two-factor authentication</div>
                <div className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account.
                </div>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>New password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline">Update password</Button>
            </div>
          </Card>

          <Card className="p-6 border-destructive/40">
            <div className="font-medium">{t('deleteAccount')}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <div className="mt-4">
              <Button variant="destructive">{t('deleteAccount')}</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t('language')}</div>
                <div className="text-sm text-muted-foreground">
                  Sets the interface language across all sessions.
                </div>
              </div>
              <LocaleSwitcher />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t('theme')}</div>
                <div className="text-sm text-muted-foreground">
                  Use system, light, or dark mode.
                </div>
              </div>
              <ThemeToggle />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 space-y-4">
            <Toggle label="Usage alerts" desc="Be notified when usage spikes unexpectedly." />
            <Separator />
            <Toggle label="Billing emails" desc="Receipts, renewal reminders, and refunds." />
            <Separator />
            <Toggle label="Product news" desc="Occasional updates about new features." />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Toggle({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <Switch defaultChecked />
    </div>
  );
}
