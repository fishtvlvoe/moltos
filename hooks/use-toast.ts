'use client';

import { toast } from 'sonner';

/**
 * 與 shadcn 慣例對齊：元件內用 const { toast } = useToast()
 */
export function useToast() {
  return { toast };
}
