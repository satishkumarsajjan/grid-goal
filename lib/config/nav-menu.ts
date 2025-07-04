import { LayoutDashboard, Target, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Define the type for our menu items for type safety
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

// This is the definitive list of main navigation links for the app.
export const mainNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Goals',
    href: '/goals',
    icon: Target,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
