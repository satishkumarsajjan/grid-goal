import type { LucideIcon } from 'lucide-react';
import {
  ChartNoAxesCombined,
  LayoutDashboard,
  Target,
  Trophy,
} from 'lucide-react';

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
    title: 'Insights',
    href: '/insights',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Awards',
    href: '/awards',
    icon: Trophy,
  },
];
