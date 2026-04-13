'use client';

// T044: Gmail connection status — three states (connected / disconnected / loading)
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const S = {
  cardTitle: 'Gmail \u9023\u63a5\u72c0\u614b',
  rowStatus: '\u9023\u63a5\u72c0\u614b',
  badgeLoading: '\u9023\u63a5\u4e2d',
  badgeOk: '\u5df2\u9023\u63a5',
  badgeOff: '\u672a\u9023\u63a5',
  account: '\u5e33\u865f',
  ariaLoading: '\u9023\u63a5\u4e2d',
} as const;

export interface GmailStatusProps {
  email?: string | null;

  lastSyncTime?: string | null;

  isLoading?: boolean;
}

export function GmailStatus({
  email,
  lastSyncTime,
  isLoading = false,
}: GmailStatusProps) {
  const isConnected = Boolean(email) && !isLoading;

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
          </>
        ) : null}

        {isLoading && !isConnected ? (
          <div className="flex justify-center py-1">
            <Loader2
              className="size-6 animate-spin text-orange-500"
              aria-label={S.ariaLoading}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
