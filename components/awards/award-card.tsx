import { type AwardId } from '@prisma/client';
import {
  Award,
  Star,
  Zap,
  Coffee,
  ShieldCheck,
  Target,
  Clock,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// A centralized mapping of all award details. This is the single source of truth for the UI.
const AWARD_DETAILS: Record<
  AwardId,
  { title: string; description: string; icon: React.ReactNode }
> = {
  // Early Achievements
  FIRST_STEP: {
    title: 'First Step',
    description: 'Completed your very first focus session. Welcome!',
    icon: <Star className='h-full w-full' />,
  },
  THE_ARCHITECT: {
    title: 'The Architect',
    description: 'Created a goal with at least 5 tasks.',
    icon: <Award className='h-full w-full' />,
  },
  IGNITION: {
    title: 'Ignition',
    description: 'Logged a total of 10 hours of focus time.',
    icon: <Zap className='h-full w-full' />,
  },
  PERFECT_HANDOFF: {
    title: 'Perfect Handoff',
    description: "Used the 'Next Step' note 5 times to chain your focus.",
    icon: <ShieldCheck className='h-full w-full' />,
  },

  // Streak & Consistency Awards
  KINDLING: {
    title: 'Kindling',
    description: 'Maintained a 3-day focus streak.',
    icon: <Award className='h-full w-full' />,
  },
  PERFECT_WEEK: {
    title: 'Perfect Week',
    description: 'Hit your daily target 7 days in a row.',
    icon: <Target className='h-full w-full' />,
  },
  IRON_WILL: {
    title: 'Iron Will',
    description: 'Maintained an incredible 30-day focus streak.',
    icon: <Trophy className='h-full w-full' />,
  },
  WEEKEND_WARRIOR: {
    title: 'Weekend Warrior',
    description: 'Logged over 4 hours of focus on a Saturday or Sunday.',
    icon: <Award className='h-full w-full' />,
  },

  // Session & Time Milestones
  JOURNEYMAN: {
    title: 'Journeyman',
    description: 'Logged a total of 100 hours of focus time.',
    icon: <Clock className='h-full w-full' />,
  },
  CENTURION: {
    title: 'Centurion',
    description: 'Completed a single goal with over 100 hours logged.',
    icon: <Award className='h-full w-full' />,
  },
  DEEP_DIVE: {
    title: 'Deep Dive',
    description: 'Completed a single focus session lasting over 2 hours.',
    icon: <Zap className='h-full w-full' />,
  },
  MARATHONER: {
    title: 'Marathoner',
    description: 'Focused for over 5 hours in a single day.',
    icon: <Zap className='h-full w-full' />,
  },

  // Goal & Task Completion Awards
  THE_FINISHER: {
    title: 'The Finisher',
    description: 'Completed your first goal.',
    icon: <Trophy className='h-full w-full' />,
  },
  AHEAD_OF_THE_CURVE: {
    title: 'Ahead of the Curve',
    description: 'Completed a goal before its deadline.',
    icon: <Award className='h-full w-full' />,
  },
  MASTER_PLANNER: {
    title: 'Master Planner',
    description: 'Created a goal with 3 or more levels of sub-goals.',
    icon: <Award className='h-full w-full' />,
  },
  SERIAL_ACHIEVER: {
    title: 'Serial Achiever',
    description: 'Completed 10 goals.',
    icon: <Trophy className='h-full w-full' />,
  },

  // Special & Mentality Awards
  THE_COMEBACK: {
    title: 'The Comeback',
    description: 'Restored a streak after using Vacation Mode.',
    icon: <Award className='h-full w-full' />,
  },
  GRIT: {
    title: 'Grit',
    description:
      'Pushed through and logged a session that felt like a struggle.',
    icon: <ShieldCheck className='h-full w-full' />,
  },
  STRATEGIC_REST: {
    title: 'Strategic Rest',
    description: 'Used Vacation Mode to take a planned break.',
    icon: <Coffee className='h-full w-full' />,
  },
  THE_ANALYST: {
    title: 'The Analyst',
    description: "Used the Interactive Grid 'Review Mode' 10 times.",
    icon: <Award className='h-full w-full' />,
  },
};

interface AwardCardProps {
  awardId: AwardId;
  isUnlocked: boolean;
}

export function AwardCard({ awardId, isUnlocked }: AwardCardProps) {
  const details = AWARD_DETAILS[awardId];
  if (!details) return null; // Safety net if an award isn't defined

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex flex-col items-center justify-center text-center p-4 border rounded-lg aspect-square transition-all duration-300 ease-in-out transform hover:-translate-y-1',
              isUnlocked
                ? 'bg-amber-900/10 border-amber-600/30 shadow-md'
                : 'bg-muted/30 border-dashed'
            )}
          >
            <div
              className={cn(
                'w-1/2 h-1/2 transition-all duration-300',
                isUnlocked ? 'text-amber-500' : 'text-muted-foreground/30'
              )}
            >
              {details.icon}
            </div>
            <h3
              className={cn(
                'font-semibold text-xs sm:text-sm mt-2',
                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {details.title}
            </h3>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className='font-semibold'>{details.title}</p>
          <p className='text-sm text-muted-foreground'>{details.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
