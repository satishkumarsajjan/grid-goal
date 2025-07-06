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
import { LayoutDashboardIcon, Settings } from 'lucide-react';
import { Separator } from '../ui/separator';

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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              variant={
                pathname.startsWith('/dashboard') ? 'outline' : 'default'
              }
            >
              <Link href={'/dashboard'}>
                <LayoutDashboardIcon className='h-4 w-4' />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className='my-2' />
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
        <SidebarMenuButton
          asChild
          variant={pathname.startsWith('/settings') ? 'outline' : 'default'}
        >
          <Link href={'/settings'}>
            <Settings className='h-4 w-4' />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
        <UserButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
