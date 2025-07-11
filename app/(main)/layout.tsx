'use client';

import { useSession } from 'next-auth/react';
import { type User } from 'next-auth';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FocusSessionUI } from '@/components/timer/focus-session-ui';
import { CommandPalette } from '@/components/command/command-palette';
import { WeeklyResetFlow } from '@/components/reset/weekly-reset-flow';
import { useTimerStore } from '@/store/timer-store';
import { Skeleton } from '@/components/ui/skeleton';
// --- NEW: Import the onboarding components ---
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { OnboardingTrigger } from '@/components/onboarding/OnboardingTrigger';

/**
 * This is the main layout for the authenticated part of the application.
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

      <OnboardingTrigger />
      <OnboardingFlow />

      {isInSession ? (
        <FocusSessionUI />
      ) : (
        <>
          <AppSidebar user={user} />
          <main className='flex-1 h-screen pb-8'>
            <div className='p-4 sm:p-6 md:p-8 h-full'>
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
