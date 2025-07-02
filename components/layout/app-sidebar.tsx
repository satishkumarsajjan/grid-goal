'use client'; // This component will have client-side hooks for path checking

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'; // Assuming these are the components from your library

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from './user-button'; // We will create this next
import { type User } from 'next-auth';

import { mainNav } from '@/lib/config/nav-menu';
import GridGoalLogo from '../landing-page/grid-goal-logo';

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <GridGoalLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  variant={isActive ? 'outline' : 'default'}
                >
                  <Link href={item.href}>
                    <item.icon className='h-4 w-4' />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {/* The UserButton will show the user's avatar and name */}
        <UserButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
