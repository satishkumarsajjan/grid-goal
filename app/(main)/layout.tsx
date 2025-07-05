'use client';

import { useSession } from 'next-auth/react';
import { type User } from 'next-auth';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FocusSessionUI } from '@/components/timer/focus-session-ui';
import { CommandPalette } from '@/components/command/command-palette';
import { WeeklyResetFlow } from '@/components/reset/weekly-reset-flow';
import { useTimerStore } from '@/store/timer-store';
import { Skeleton } from '@/components/ui/skeleton'; // For a better loading state

/**
 * This is the main layout for the authenticated part of the application.
 * It is a Client Component ('use client') because it needs to reactively
 * subscribe to both the NextAuth session state and our custom Zustand timer state.
 *
 * Its primary responsibility is to decide whether to show the standard
 * application UI (sidebar + main content) or the full-screen FocusSessionUI.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession({ required: true });

  const isInSession = useTimerStore((state) => !!state.activeTask);

  if (status === 'loading') {
    return <AppLoadingSkeleton />;
  }

  const user = session.user as User;

  return (
    <SidebarProvider>
      <CommandPalette />
      <WeeklyResetFlow />

      {isInSession ? (
        <FocusSessionUI />
      ) : (
        <>
          <AppSidebar user={user} />
          <main className='flex-1 overflow-y-auto'>
            <div className='p-4 sm:p-6 md:p-8'>
              <SidebarTrigger className='mb-4' />
              {children}
            </div>
          </main>
        </>
      )}
    </SidebarProvider>
  );
}

function AppLoadingSkeleton() {
  return (
    <div className='flex h-screen bg-muted/40'>
      <div className='hidden md:flex flex-col w-64 border-r p-4 space-y-4'>
        <Skeleton className='h-8 w-32' />
        <div className='space-y-2'>
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-full' />
        </div>
      </div>

      <div className='flex-1 p-8'>
        <Skeleton className='h-10 w-64 mb-8' />
        <div className='space-y-4'>
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-40 w-full' />
        </div>
      </div>
    </div>
  );
}
