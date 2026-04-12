'use client';

import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

type ToasterProps = ComponentProps<typeof SonnerToaster>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
