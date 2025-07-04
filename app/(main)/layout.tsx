'use client'; // This layout MUST be a client component to use a hook.

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { type User } from 'next-auth';

// Import our store and the new Zen Mode UI
import { useTimerStore } from '@/store/timer-store';
import { FocusSessionUI } from '@/components/timer/focus-session-ui';
import { useSession } from 'next-auth/react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We now get the session via the client-side useSession hook
  const { data: session } = useSession({ required: true });

  // Subscribe to the timer's active state
  const isSessionActive = useTimerStore((state) => state.isActive);

  // We need this check because the session might be loading initially
  if (!session) {
    return <div>Loading session...</div>; // Or a full-screen loader
  }

  return (
    // The SidebarProvider remains at the top level
    <SidebarProvider>
      {/* 
        CONDITIONAL RENDERING: This is the core logic.
        If a focus session is active, we render the Zen Mode UI.
        If not, we render the normal application layout.
      */}
      {isSessionActive ? (
        <FocusSessionUI />
      ) : (
        <>
          <AppSidebar user={session.user as User} />
          <main className='flex-1'>
            <div className='p-4 sm:p-6 md:p-8'>
              <SidebarTrigger className='mb-4 lg:hidden' />
              {children}
            </div>
          </main>
        </>
      )}
    </SidebarProvider>
  );
}
