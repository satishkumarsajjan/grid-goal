import { auth } from '@/auth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { type Session } from 'next-auth';

// This remains a Server Component
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await auth()) as Session;

  return (
    // Wrap the entire layout in the SidebarProvider
    <SidebarProvider>
      {/* Render our custom AppSidebar, passing the user data */}
      {session.user && <AppSidebar user={session.user} />}

      {/* The main content area */}
      <main className='flex-1 lg:ml-64'>
        <div className='p-4 sm:p-6 md:p-8'>
          {/* The "hamburger" menu trigger for mobile/tablet */}
          <SidebarTrigger className='mb-4 lg:hidden' />

          {/* The actual page content will be rendered here */}
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
