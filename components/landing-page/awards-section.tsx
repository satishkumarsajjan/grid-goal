'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
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
import { useRef } from 'react';

const awardCategories = [
  {
    category: 'Onboarding & Early Wins',
    description: 'For starting your journey and building initial momentum.',
    awards: [
      {
        icon: PlayCircle,
        title: 'First Step',
        details: 'Complete your very first task.',
        color: 'from-gray-400 to-gray-600',
      },
      {
        icon: DraftingCompass,
        title: 'The Architect',
        details: 'Create a goal with at least three sub-tasks.',
        color: 'from-slate-500 to-slate-700',
      },
      {
        icon: BrainCircuit,
        title: 'Ignition',
        details: 'Complete your first full focus session.',
        color: 'from-sky-400 to-sky-600',
      },
      {
        icon: ClipboardCheck,
        title: 'Perfect Handoff',
        details: 'Use the "My Next Step Is" note for the first time.',
        color: 'from-emerald-400 to-emerald-600',
      },
    ],
  },
  {
    category: 'Consistency & Habit Formation',
    description: 'For showing up day after day and making progress a habit.',
    awards: [
      {
        icon: Flame,
        title: 'Kindling',
        details: 'Achieve a 3-day streak.',
        color: 'from-orange-400 to-orange-500',
      },
      {
        icon: Zap,
        title: 'Perfect Week',
        details: 'Achieve a 7-day streak.',
        color: 'from-yellow-400 to-yellow-500',
      },
      {
        icon: Shield,
        title: 'Iron Will',
        details: 'Achieve a 30-day streak.',
        color: 'from-red-500 to-red-700',
      },
      {
        icon: CalendarCheck,
        title: 'Weekend Warrior',
        details: 'Complete a session on a Saturday and Sunday.',
        color: 'from-indigo-400 to-indigo-500',
      },
    ],
  },
  {
    category: 'Volume & Deep Work',
    description: 'For dedicating significant time and achieving deep focus.',
    awards: [
      {
        icon: Clock,
        title: 'Journeyman',
        details: 'Log 50 hours of focused effort.',
        color: 'from-cyan-400 to-cyan-600',
      },
      {
        icon: Award,
        title: 'Centurion',
        details: 'Log 100 hours of deep work.',
        color: 'from-blue-500 to-blue-700',
      },
      {
        icon: Waves,
        title: 'Deep Dive',
        details: 'Complete a single session over 2 hours.',
        color: 'from-teal-400 to-teal-600',
      },
      {
        icon: Mountain,
        title: 'Marathoner',
        details: 'Log over 4 hours in a single day.',
        color: 'from-fuchsia-500 to-fuchsia-700',
      },
    ],
  },
  {
    category: 'Mastery & Completion',
    description: 'For finishing what you started and achieving your goals.',
    awards: [
      {
        icon: Trophy,
        title: 'The Finisher',
        details: 'Complete a goal from start to finish.',
        color: 'from-amber-400 to-amber-600',
      },
      {
        icon: Rocket,
        title: 'Ahead of the Curve',
        details: 'Complete a goal before its deadline.',
        color: 'from-violet-500 to-purple-600',
      },
      {
        icon: Network,
        title: 'Master Planner',
        details: 'Complete a goal with over 5 nested sub-goals.',
        color: 'from-rose-400 to-rose-600',
      },
      {
        icon: Repeat,
        title: 'Serial Achiever',
        details: 'Successfully complete 5 major goals.',
        color: 'from-green-500 to-green-700',
      },
    ],
  },
  {
    category: 'Resilience & Real Life',
    description: 'For staying the course even when things get tough.',
    awards: [
      {
        icon: Heart,
        title: 'The Comeback',
        details: 'Return after breaking a streak of 7+ days.',
        color: 'from-pink-500 to-pink-600',
      },
      {
        icon: Coffee,
        title: 'Grit',
        details: 'Show up and log time on a difficult day.',
        color: 'from-stone-500 to-stone-700',
      },
      {
        icon: Palmtree,
        title: 'Strategic Rest',
        details: 'Use Vacation Mode to protect your streak.',
        color: 'from-lime-400 to-lime-600',
      },
      {
        icon: Lightbulb,
        title: 'The Analyst',
        details: 'Use the diagnostic tools to adapt your plan.',
        color: 'from-blue-400 to-indigo-500',
      },
    ],
  },
];

function AwardCard({
  award,
}: {
  award: (typeof awardCategories)[0]['awards'][0];
}) {
  const Icon = award.icon;
  return (
    <div className='award-card flex flex-col items-center text-center p-6 border border-border rounded-2xl bg-muted/30 h-full transform transition-transform duration-300 hover:-translate-y-2'>
      <div
        className={`relative flex items-center justify-center size-16 rounded-full bg-gradient-to-br ${award.color} shadow-lg mb-4`}
      >
        <Icon className='size-8 text-white' strokeWidth={2} />
      </div>
      <h3 className='font-bold text-lg tracking-tight'>{award.title}</h3>
      <p className='text-sm text-muted-foreground mt-1 flex-grow'>
        {award.details}
      </p>
    </div>
  );
}

export function AwardsSection() {
  const container = useRef(null);

  useGSAP(
    () => {
      gsap.set('.award-card', {
        opacity: 0,
      });

      gsap.to('.award-card', {
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.05,
        scrollTrigger: {
          trigger: container.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: container }
  );

  return (
    <section id='awards' className='py-24 md:py-32'>
      <div className='container mx-auto px-6'>
        <div className='text-center mb-16 max-w-3xl mx-auto'>
          <h2 className='text-4xl md:text-5xl font-bold tracking-tighter'>
            A Trophy Case for Your Journey
          </h2>
          <p className='mt-4 text-lg text-muted-foreground'>
            Your hard work doesn&apos;t go unnoticed. Unlock a collection of
            awards that celebrate every step of your journey, from the first
            task to total mastery.
          </p>
        </div>
        <div ref={container} className='flex flex-col gap-16'>
          {awardCategories.map((category) => (
            <div key={category.category}>
              <div className='mb-8 text-center md:text-left'>
                <h3 className='text-2xl font-bold tracking-tight'>
                  {category.category}
                </h3>
                <p className='text-muted-foreground mt-1'>
                  {category.description}
                </p>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6'>
                {category.awards.map((award) => (
                  <AwardCard key={award.title} award={award} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
