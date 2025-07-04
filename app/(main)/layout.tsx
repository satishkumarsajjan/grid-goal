'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { type User } from 'next-auth';

import { useTimerStore } from '@/store/timer-store';
import { FocusSessionUI } from '@/components/timer/focus-session-ui';
import { useSession } from 'next-auth/react';
import { CommandPalette } from '@/components/command/command-palette';
import { WeeklyResetFlow } from '@/components/reset/weekly-reset-flow';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession({ required: true });

  const isSessionActive = useTimerStore((state) => state.isActive);

  if (!session) {
    return <div>Loading session...</div>;
  }

  return (
    <SidebarProvider>
      <CommandPalette />
      <WeeklyResetFlow />
      {isSessionActive ? (
        <FocusSessionUI />
      ) : (
        <>
          <AppSidebar user={session.user as User} />
          <main className='flex-1'>
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
