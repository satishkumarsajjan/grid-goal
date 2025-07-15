'use client';

import { type User } from 'next-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { mainNav } from '@/lib/config/nav-menu';
import GridGoalLogo from '../landing-page/grid-goal-logo';
import ThemeSwitch from '../landing-page/theme-switch';
import { UserButton } from './user-button';

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  // A helper to create the nav items. This supports a future collapsed state.
  const NavItem = ({
    item,
    isCollapsed,
  }: {
    item: (typeof mainNav)[0];
    isCollapsed: boolean;
  }) => {
    const isActive =
      (item.href === '/dashboard' && pathname === '/dashboard') ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href));

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                asChild
                variant={isActive ? 'outline' : 'default'}
                size='lg'
              >
                <Link href={item.href}>
                  <item.icon className='h-5 w-5' />
                  <span className='sr-only'>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side='right'>{item.title}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild variant={isActive ? 'outline' : 'default'}>
          <Link href={item.href}>
            <item.icon className='h-5 w-5 mr-3' />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar aria-label='Main navigation'>
      <SidebarHeader className='p-4'>
        <GridGoalLogo />
      </SidebarHeader>

      <SidebarContent className='flex-grow p-4'>
        <SidebarMenu>
          {mainNav.map((item) => (
            <NavItem key={item.href} item={item} isCollapsed={false} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className='mt-auto p-4'>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            variant={pathname.startsWith('/settings') ? 'outline' : 'default'}
          >
            <Link href={'/settings'}>
              <Settings className='h-5 w-5 mr-3' />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <UserButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
