import { auth } from '@/auth';
// import { Sidebar } from '@/components/layout/sidebar'; // We will create this next
import { Session } from 'next-auth';

// This is a Server Component. It can fetch data on the server.
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the user's session data on the server.
  // The middleware has already ensured that only authenticated users can reach this point.
  const session = (await auth()) as Session;

  return (
    <div className='flex h-screen'>
      {/* 
        The Sidebar is a fixed component that will be present on all pages
        within this layout. We pass the user's session data to it so it
        can display the user's name and image.
      */}
      {/* <Sidebar user={session.user} /> */}
      <div>Here comes Sidebar</div>
      {/* 
        The 'main' element will contain the actual page content.
        The 'children' prop here will be the `page.tsx` file of the currently
        active route (e.g., /dashboard, /goals).
      */}
      <main className='flex-1 overflow-y-auto p-4 sm:p-6 md:p-8'>
        {children}
      </main>
    </div>
  );
}
