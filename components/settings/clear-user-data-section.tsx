'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface ClearUserDataSectionProps {
  isDemo: boolean;
}

export function ClearUserDataSection({ isDemo }: ClearUserDataSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    setIsDeleting(true);

    try {
      const res = await fetch('/api/user/data', {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        toast.error(body.error ?? 'Failed to delete data');
        return;
      }

      toast.success('Data deleted successfully');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to delete data');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-red-200 bg-red-50/80 shadow-sm">
      <CardContent className="flex flex-col gap-3 py-5 px-4">
        <div className="flex flex-col gap-1">
          <p className="text-red-800 text-sm font-semibold">危險區域</p>

          <p className="text-red-700/90 text-xs leading-relaxed">
            清除後無法復原，會刪除此帳號內儲存的對話與相關資料。
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          disabled={isDemo || isDeleting}
          className="w-full rounded-2xl font-medium"
          onClick={() => setOpen(true)}
        >
          Clear All Conversation Data
        </Button>

        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            if (isDeleting) return;
            setOpen(next);
          }}
        >

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all conversation data?</AlertDialogTitle>

              <AlertDialogDescription className="text-left text-gray-600">
                This will permanently delete all conversations, insights, and
                history. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                className="rounded-lg gap-2 inline-flex items-center justify-center"
                onClick={() => void handleConfirmDelete()}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isDemo && (
          <p className="text-gray-500 text-xs text-center">
            Demo 模式無法清除資料。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
