'use client';

// Gmail settings: reconnect, re-auth, switch account, disconnect
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const MSG = {
  disconnectFail:
    'Gmail \u89e3\u9664\u7d81\u5b9a\u5931\u6557\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\u3002',
  disconnectOk:
    '\u5df2\u89e3\u9664\u7d81\u5b9a\u3002\u5e73\u975c\u6307\u6578\u6b77\u53f2\u4ecd\u6703\u4fdd\u7559\u3002',
  switchFail:
    'Gmail \u5e33\u865f\u66f4\u65b0\u5931\u6557\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\u3002',
  switchOk: (email: string) =>
    `Gmail \u5df2\u66f4\u65b0\u70ba ${email}`,
  linkedOk: 'Gmail \u5df2\u6210\u529f\u9023\u7d50',
  linking: '\u9023\u7d50\u4e2d\u2026',
  reconnect: '\u91cd\u65b0\u9023\u7d50 Gmail',
  authorizing: '\u6388\u6b0a\u4e2d\u2026',
  reauthorize: '\u91cd\u65b0\u6388\u6b0a',
  openingGoogle: '\u958b\u555f Google\u2026',
  switchAccount: '\u5207\u63db Gmail \u5e33\u865f',
  disconnectBtn: 'Gmail \u89e3\u9664\u7d81\u5b9a',
  switchTitle: '\u8981\u6539\u7528\u53e6\u4e00\u500b Gmail \u5e33\u865f\uff1f',
  switchDesc:
    '\u63a5\u4e0b\u4f86\u6703\u958b\u555f Google\uff0c\u8acb\u9078\u64c7\u8981\u7528\u4f86\u5206\u6790\u4fe1\u4ef6\u7684\u5e33\u865f\u3002\u60a8\u5728\u672c App \u7d2f\u7a4d\u7684\u5e73\u975c\u6307\u6578\u6b77\u53f2\u6703\u4fdd\u7559\uff0c\u4e0d\u6703\u88ab\u522a\u9664\u3002',
  switchConfirm: '\u524d\u5f80 Google \u9078\u64c7\u5e33\u865f',
  opening: '\u958b\u555f\u4e2d\u2026',
  disconnectTitle: 'Gmail \u89e3\u9664\u7d81\u5b9a\uff1f',
  disconnectDesc:
    '\u78ba\u5b9a\u8981\u89e3\u9664 Gmail \u7d81\u5b9a\u55ce\uff1f\u5e73\u975c\u6307\u6578\u6b77\u53f2\u8a18\u9304\u6703\u4fdd\u7559\u3002\u82e5\u8981\u518d\u6b21\u5206\u6790\u4fe1\u4ef6\uff0c\u53ef\u96a8\u6642\u91cd\u65b0\u9023\u7d50 Gmail\u3002',
  processing: '\u8655\u7406\u4e2d\u2026',
  confirmDisconnect: '\u78ba\u5b9a\u89e3\u9664',
  loading: '\u8f09\u5165\u4e2d\u2026',
  cancel: '\u53d6\u6d88',
} as const;

const GMAIL_SETTINGS_PATH = '/settings/gmail';

function callbackWithTokenSync(extra?: { prompt?: string }) {
  const base = `${GMAIL_SETTINGS_PATH}?gmail_token_sync=1`;

  if (extra?.prompt) {
    return signIn('google', { callbackUrl: base }, { prompt: extra.prompt });
  }

  return signIn('google', { callbackUrl: base });
}

interface GmailActionsProps {
  isGmailConnected: boolean;
}

function GmailActionsInner({ isGmailConnected }: GmailActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSwitchStarting, setIsSwitchStarting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [isTokenSyncing, setIsTokenSyncing] = useState(false);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);

    try {
      const res = await fetch('/api/gmail/disconnect', {
        method: 'POST',
        credentials: 'same-origin',
      });

      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || body.success !== true) {
        toast.error(MSG.disconnectFail);

        return;
      }

      toast.success(MSG.disconnectOk);
      setDisconnectOpen(false);
      router.refresh();
    } catch {
      toast.error(MSG.disconnectFail);
    } finally {
      setIsDisconnecting(false);
    }
  }, [router, toast]);

  const startSwitchAccount = useCallback(async () => {
    setIsSwitchStarting(true);

    try {
      await callbackWithTokenSync({ prompt: 'select_account' });
    } finally {
      setIsSwitchStarting(false);
    }
  }, []);

  const startReconnect = useCallback(async () => {
    setIsReconnecting(true);

    try {
      await callbackWithTokenSync();
    } finally {
      setIsReconnecting(false);
    }
  }, []);

  const startReauthorize = useCallback(async () => {
    setIsReauthorizing(true);

    try {
      await callbackWithTokenSync();
    } finally {
      setIsReauthorizing(false);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('gmail_token_sync') !== '1') return;

    let cancelled = false;

    (async () => {
      setIsTokenSyncing(true);

      try {
        const res = await fetch('/api/gmail/switch-account', {
          method: 'POST',
          credentials: 'same-origin',
        });

        const body = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          email?: string;
        };

        if (!res.ok || body.success !== true) {
          if (!cancelled) {
            toast.error(MSG.switchFail);
          }

          return;
        }

        if (!cancelled) {
          const label = body.email ? MSG.switchOk(body.email) : MSG.linkedOk;

          toast.success(label);
        }
      } catch {
        if (!cancelled) {
          toast.error(MSG.switchFail);
        }
      } finally {
        if (!cancelled) {
          setIsTokenSyncing(false);
          router.replace(GMAIL_SETTINGS_PATH);
          router.refresh();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, toast]);

  const busy =
    isDisconnecting ||
    isSwitchStarting ||
    isReconnecting ||
    isReauthorizing ||
    isTokenSyncing;

  return (
    <div className="flex flex-col gap-3">
      {!isGmailConnected ? (
        <Button
          className="w-full rounded-2xl text-white font-medium"
          style={{ backgroundColor: '#C67A52' }}
          disabled={busy}
          onClick={() => void startReconnect()}
        >
          {isReconnecting || isTokenSyncing ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2 inline" />
              {MSG.linking}
            </>
          ) : (
            MSG.reconnect
          )}
        </Button>
      ) : (
        <>
          <Button
            className="w-full rounded-2xl text-white font-medium"
            style={{ backgroundColor: '#C67A52' }}
            disabled={busy}
            onClick={() => void startReauthorize()}
          >
            {isReauthorizing || isTokenSyncing ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2 inline" />
                {MSG.authorizing}
              </>
            ) : (
              MSG.reauthorize
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl border-[#C67A52]/40 text-[#C67A52] hover:bg-[#C67A52]/10"
            disabled={busy}
            onClick={() => setSwitchOpen(true)}
          >
            {isSwitchStarting || isTokenSyncing ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2 inline" />
                {MSG.openingGoogle}
              </>
            ) : (
              MSG.switchAccount
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
            disabled={busy}
            onClick={() => setDisconnectOpen(true)}
          >
            {MSG.disconnectBtn}
          </Button>

          <AlertDialog
            open={switchOpen}
            onOpenChange={(next) => {
              if (isSwitchStarting || isTokenSyncing) return;
              setSwitchOpen(next);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{MSG.switchTitle}</AlertDialogTitle>

                <AlertDialogDescription className="text-left text-gray-600">
                  {MSG.switchDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSwitchStarting}>
                  {MSG.cancel}
                </AlertDialogCancel>

                <Button
                  type="button"
                  className="rounded-lg gap-2 inline-flex items-center justify-center text-white"
                  style={{ backgroundColor: '#C67A52' }}
                  disabled={isSwitchStarting}
                  onClick={() => {
                    setSwitchOpen(false);
                    void startSwitchAccount();
                  }}
                >
                  {isSwitchStarting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {MSG.opening}
                    </>
                  ) : (
                    MSG.switchConfirm
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={disconnectOpen}
            onOpenChange={(next) => {
              if (isDisconnecting) return;
              setDisconnectOpen(next);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{MSG.disconnectTitle}</AlertDialogTitle>

                <AlertDialogDescription className="text-left text-gray-600">
                  {MSG.disconnectDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDisconnecting}>
                  {MSG.cancel}
                </AlertDialogCancel>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDisconnecting}
                  className="rounded-lg gap-2 inline-flex items-center justify-center"
                  onClick={() => void handleDisconnect()}
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {MSG.processing}
                    </>
                  ) : (
                    MSG.confirmDisconnect
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

export function GmailActions(props: GmailActionsProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3">
          <Button className="w-full rounded-2xl" disabled>
            <Loader2 className="size-4 animate-spin mr-2 inline" />
            {MSG.loading}
          </Button>
        </div>
      }
    >
      <GmailActionsInner {...props} />
    </Suspense>
  );
}
