'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { type User } from 'next-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from './user-button';
import { mainNav } from '@/lib/config/nav-menu';
import { LayoutDashboardIcon, Settings } from 'lucide-react';
import GridGoalLogo from '../landing-page/grid-goal-logo';
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
