'use client';

// T044: Gmail connection status — three states (connected / disconnected / loading)
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const S = {
  cardTitle: 'Gmail \u9023\u63a5\u72c0\u614b',
  rowStatus: '\u9023\u63a5\u72c0\u614b',
  badgeLoading: '\u9023\u63a5\u4e2d',
  badgeOk: '\u5df2\u9023\u63a5',
  badgeOff: '\u672a\u9023\u63a5',
  account: '\u5e33\u865f',
  switchAccount: '\u5207\u63db\u5e33\u865f',
  unbind: '\u89e3\u9664\u7d81\u5b9a',
  connectGmail: '\u9023\u7d50 Gmail',
  ariaLoading: '\u9023\u63a5\u4e2d',
  dialogTitle: '\u89e3\u9664 Gmail \u7d81\u5b9a\uff1f',
  dialogBody:
    '\u78ba\u5b9a\u8981\u89e3\u9664\u7d81\u5b9a\u55ce\uff1f\u4f60\u7684\u5e73\u975c\u6307\u6578\u6b77\u53f2\u5c07\u88ab\u4fdd\u7559\u3002',
  cancel: '\u53d6\u6d88',
  busy: '\u8655\u7406\u4e2d\u2026',
  confirmUnbind: '\u78ba\u8a8d\u89e3\u9664',
} as const;

export interface GmailStatusProps {
  email?: string | null;

  lastSyncTime?: string | null;

  isLoading?: boolean;

  /** true = only badge + account + sync (buttons live in gmail-actions) */
  statusOnly?: boolean;

  onConnect?: () => void;

  onSwitch?: () => void;

  onDisconnect?: () => void | Promise<void>;
}

export function GmailStatus({
  email,
  lastSyncTime,
  isLoading = false,
  statusOnly = false,
  onConnect,
  onSwitch,
  onDisconnect,
}: GmailStatusProps) {
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const [disconnectBusy, setDisconnectBusy] = useState(false);

  const isConnected = Boolean(email) && !isLoading;

  const isDisconnected = !email && !isLoading;

  async function confirmDisconnect() {
    if (!onDisconnect) return;

    setDisconnectBusy(true);

    try {
      await onDisconnect();
      setDisconnectOpen(false);
    } catch {
      // Keep dialog open; toast handled by caller
    } finally {
      setDisconnectBusy(false);
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-gray-800">
          {S.cardTitle}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <span className="text-sm text-gray-500">{S.rowStatus}</span>

          {isLoading ? (
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-orange-800 gap-1.5 font-medium"
            >
              <Loader2 className="size-3 animate-spin" aria-hidden />
              {S.badgeLoading}
            </Badge>
          ) : isConnected ? (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-800 font-medium"
            >
              {S.badgeOk}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-gray-600 font-medium"
            >
              {S.badgeOff}
            </Badge>
          )}
        </div>

        {isConnected ? (
          <>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-500">{S.account}</span>

              <span className="text-sm text-gray-800 font-medium break-all text-right">
                {email}
              </span>
            </div>

            {lastSyncTime ? (
              <p className="text-sm text-gray-600">{lastSyncTime}</p>
            ) : null}

            {!statusOnly ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="w-full rounded-2xl text-white font-medium sm:flex-1"
                  style={{ backgroundColor: '#C67A52' }}
                  disabled={isLoading}
                  onClick={() => onSwitch?.()}
                >
                  {S.switchAccount}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-2xl border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 sm:flex-1"
                  disabled={isLoading}
                  onClick={() => setDisconnectOpen(true)}
                >
                  {S.unbind}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}

        {!statusOnly && isDisconnected ? (
          <Button
            type="button"
            className="w-full rounded-2xl text-white font-medium"
            style={{ backgroundColor: '#C67A52' }}
            disabled={isLoading}
            onClick={() => onConnect?.()}
          >
            {S.connectGmail}
          </Button>
        ) : null}

        {isLoading && !isConnected ? (
          <div className="flex justify-center py-1">
            <Loader2
              className="size-6 animate-spin text-orange-500"
              aria-label={S.ariaLoading}
            />
          </div>
        ) : null}

        {!statusOnly ? (
          <Dialog
          open={disconnectOpen}
          onOpenChange={(next) => {
            if (disconnectBusy) return;
            setDisconnectOpen(next);
          }}
        >
          <DialogContent
            className="rounded-2xl"
            onPointerDownOutside={(e) => {
              if (disconnectBusy) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (disconnectBusy) e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>{S.dialogTitle}</DialogTitle>

              <DialogDescription className="text-left text-gray-600">
                {S.dialogBody}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                disabled={disconnectBusy}
                onClick={() => setDisconnectOpen(false)}
              >
                {S.cancel}
              </Button>

              <Button
                type="button"
                variant="destructive"
                className="rounded-lg gap-2"
                disabled={disconnectBusy}
                onClick={() => void confirmDisconnect()}
              >
                {disconnectBusy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {S.busy}
                  </>
                ) : (
                  S.confirmUnbind
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        ) : null}
      </CardContent>
    </Card>
  );
}
