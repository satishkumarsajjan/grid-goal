import { AwardId } from '@prisma/client';
import {
  Footprints,
  Landmark,
  Flame,
  ClipboardCheck,
  Zap,
  CalendarCheck2,
  ShieldCheck,
  Mountain,
  Gauge,
  Trophy,
  BrainCircuit,
  Hourglass,
  CheckCircle,
  TrendingUp,
  GitMerge,
  Repeat,
  Sparkles,
  HeartCrack,
  Bed,
  BarChart4,
} from 'lucide-react';

export const AWARDS_METADATA: Record<
  AwardId,
  { name: string; description: string; icon: React.ElementType }
> = {
  FIRST_STEP: {
    name: 'First Step',
    description: 'Completed your very first focus session.',
    icon: Footprints,
  },
  THE_ARCHITECT: {
    name: 'The Architect',
    description: 'Created your first long-term goal.',
    icon: Landmark,
  },
  IGNITION: {
    name: 'Ignition',
    description: 'Created your first task for a goal.',
    icon: Flame,
  },
  PERFECT_HANDOFF: {
    name: 'Perfect Handoff',
    description: 'Filled out the "Next Step" note after a session.',
    icon: ClipboardCheck,
  },
  KINDLING: {
    name: 'Kindling',
    description: 'Achieved a 3-day focus streak.',
    icon: Zap,
  },
  PERFECT_WEEK: {
    name: 'Perfect Week',
    description: 'Focused every day for 7 consecutive days.',
    icon: CalendarCheck2,
  },
  IRON_WILL: {
    name: 'Iron Will',
    description: 'Achieved an epic 30-day focus streak.',
    icon: ShieldCheck,
  },
  WEEKEND_WARRIOR: {
    name: 'Weekend Warrior',
    description:
      'Completed a session on a Saturday and a Sunday in the same week.',
    icon: Mountain,
  },
  JOURNEYMAN: {
    name: 'Journeyman',
    description: 'Logged a total of 25 hours of focus time.',
    icon: Gauge,
  },
  CENTURION: {
    name: 'Centurion',
    description: 'Completed 100 total focus sessions.',
    icon: Trophy,
  },
  DEEP_DIVE: {
    name: 'Deep Dive',
    description: 'Completed a single focus session of 2 hours or more.',
    icon: BrainCircuit,
  },
  MARATHONER: {
    name: 'Marathoner',
    description: 'Focused for more than 4 hours in a single day.',
    icon: Hourglass,
  },
  THE_FINISHER: {
    name: 'The Finisher',
    description: 'Completed your first goal.',
    icon: CheckCircle,
  },
  AHEAD_OF_THE_CURVE: {
    name: 'Ahead of the Curve',
    description: 'Completed a goal before its deadline.',
    icon: TrendingUp,
  },
  MASTER_PLANNER: {
    name: 'Master Planner',
    description: 'Created a goal with multiple levels of sub-goals.',
    icon: GitMerge,
  },
  SERIAL_ACHIEVER: {
    name: 'Serial Achiever',
    description: 'Successfully completed 10 goals.',
    icon: Repeat,
  },
  THE_COMEBACK: {
    name: 'The Comeback',
    description: 'Returned to focus after a break of 7 days or more.',
    icon: Sparkles,
  },
  GRIT: {
    name: 'Grit',
    description:
      "Pushed through and completed a session with a 'Struggle' vibe.",
    icon: HeartCrack,
  },
  STRATEGIC_REST: {
    name: 'Strategic Rest',
    description: 'Scheduled your first Pause Period to recharge.',
    icon: Bed,
  },
  THE_ANALYST: {
    name: 'The Analyst',
    description: 'Completed your first Weekly Reset to plan and reflect.',
    icon: BarChart4,
  },
};
