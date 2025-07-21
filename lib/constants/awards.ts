import { AwardId } from '@prisma/client';
import {
  Award,
  BrainCircuit,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Coffee,
  DraftingCompass,
  Flame,
  Heart,
  Lightbulb,
  Mountain,
  Network,
  Palmtree,
  PlayCircle,
  Repeat,
  Rocket,
  Shield,
  Trophy,
  Waves,
  Zap,
} from 'lucide-react';

export type AwardInfo = {
  id: AwardId;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
};

export type AwardCategory = {
  category: string;
  description: string;
  awards: AwardInfo[];
};

// This is our single source of truth for all UI-related award data
export const AWARD_CATEGORIES: AwardCategory[] = [
  {
    category: 'Onboarding & Early Wins',
    description: 'For starting your journey and building initial momentum.',
    awards: [
      {
        id: 'FIRST_STEP',
        title: 'First Step',
        description: 'Completed your very first focus session.',
        icon: PlayCircle,
        color: 'from-gray-400 to-gray-600',
      },
      {
        id: 'THE_ARCHITECT',
        title: 'The Architect',
        description: 'Created your first long-term goal.',
        icon: DraftingCompass,
        color: 'from-slate-500 to-slate-700',
      },
      {
        id: 'IGNITION',
        title: 'Ignition',
        description: 'Created your first task for a goal.',
        icon: BrainCircuit,
        color: 'from-sky-400 to-sky-600',
      },
      {
        id: 'PERFECT_HANDOFF',
        title: 'Perfect Handoff',
        description: 'Used the "Next Step" note for the first time.',
        icon: ClipboardCheck,
        color: 'from-emerald-400 to-emerald-600',
      },
    ],
  },
  {
    category: 'Consistency & Habit Formation',
    description: 'For showing up day after day and making progress a habit.',
    awards: [
      {
        id: 'KINDLING',
        title: 'Kindling',
        description: 'Maintained a 3-day focus streak.',
        icon: Flame,
        color: 'from-orange-400 to-orange-500',
      },
      {
        id: 'PERFECT_WEEK',
        title: 'Perfect Week',
        description: 'Focused every day for 7 consecutive days.',
        icon: Zap,
        color: 'from-yellow-400 to-yellow-500',
      },
      {
        id: 'IRON_WILL',
        title: 'Iron Will',
        description: 'Maintained an incredible 30-day focus streak.',
        icon: Shield,
        color: 'from-red-500 to-red-700',
      },
      {
        id: 'WEEKEND_WARRIOR',
        title: 'Weekend Warrior',
        description:
          'Completed a session on a Saturday and Sunday in the same week.',
        icon: CalendarCheck,
        color: 'from-indigo-400 to-indigo-500',
      },
    ],
  },
  {
    category: 'Volume & Deep Work',
    description: 'For dedicating significant time and achieving deep focus.',
    awards: [
      {
        id: 'JOURNEYMAN',
        title: 'Journeyman',
        description: 'Logged 25 hours of focused effort.',
        icon: Clock,
        color: 'from-cyan-400 to-cyan-600',
      },
      {
        id: 'CENTURION',
        title: 'Centurion',
        description: 'Completed 100 total focus sessions.',
        icon: Award,
        color: 'from-blue-500 to-blue-700',
      },
      {
        id: 'DEEP_DIVE',
        title: 'Deep Dive',
        description: 'Completed a single session over 2 hours.',
        icon: Waves,
        color: 'from-teal-400 to-teal-600',
      },
      {
        id: 'MARATHONER',
        title: 'Marathoner',
        description: 'Logged over 4 hours in a single day.',
        icon: Mountain,
        color: 'from-fuchsia-500 to-fuchsia-700',
      },
    ],
  },
  {
    category: 'Mastery & Completion',
    description: 'For finishing what you started and achieving your goals.',
    awards: [
      {
        id: 'THE_FINISHER',
        title: 'The Finisher',
        description: 'Completed your first goal.',
        icon: Trophy,
        color: 'from-amber-400 to-amber-600',
      },
      {
        id: 'AHEAD_OF_THE_CURVE',
        title: 'Ahead of the Curve',
        description: 'Completed a goal before its deadline.',
        icon: Rocket,
        color: 'from-violet-500 to-purple-600',
      },
      {
        id: 'MASTER_PLANNER',
        title: 'Master Planner',
        description: 'Created a goal with 3 or more levels of sub-goals.',
        icon: Network,
        color: 'from-rose-400 to-rose-600',
      },
      {
        id: 'SERIAL_ACHIEVER',
        title: 'Serial Achiever',
        description: 'Successfully completed 10 goals.',
        icon: Repeat,
        color: 'from-green-500 to-green-700',
      },
    ],
  },
  {
    category: 'Resilience & Real Life',
    description: 'For staying the course even when things get tough.',
    awards: [
      {
        id: 'THE_COMEBACK',
        title: 'The Comeback',
        description: 'Returned to focus after a break of 7+ days.',
        icon: Heart,
        color: 'from-pink-500 to-pink-600',
      },
      {
        id: 'GRIT',
        title: 'Grit',
        description:
          'Pushed through and logged a session that felt like a struggle.',
        icon: Coffee,
        color: 'from-stone-500 to-stone-700',
      },
      {
        id: 'STRATEGIC_REST',
        title: 'Strategic Rest',
        description: 'Scheduled your first Pause Period to recharge.',
        icon: Palmtree,
        color: 'from-lime-400 to-lime-600',
      },
      {
        id: 'THE_ANALYST',
        title: 'The Analyst',
        description: 'Completed your first Weekly Reset.',
        icon: Lightbulb,
        color: 'from-blue-400 to-indigo-500',
      },
    ],
  },
];
