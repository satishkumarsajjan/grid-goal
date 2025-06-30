'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  ArrowRight,
  ChartLine,
  Check,
  Circle,
  Clock,
  Clock10,
  Clock10Icon,
  ClockAlert,
  ClockPlusIcon,
  Hourglass,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import React, { useRef } from 'react';

import { cn } from '@/lib/utils';
import { EnterBlur } from '../ui/enter-blur';
import { PaceIndicatorChart } from './pace-indicator-chart';

const BentoCard = ({
  className,
  children,
  title,
  description,
  icon,
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <div
    className={cn(
      'bento-card group relative flex flex-col justify-between overflow-hidden rounded-xl',
      'bg-background/50 border border-border/80 shadow-inner shadow-muted-foreground/10',
      'transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10',
      'opacity-0', // Initial state for GSAP animation
      className
    )}
  >
    <div className='p-5 pb-0'>
      <div className='flex items-start gap-3'>
        <div className='text-primary'>{icon}</div>
        <div>
          <h3 className='text-base font-semibold text-foreground'>{title}</h3>
          <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
        </div>
      </div>
    </div>
    {/* Child content pushes to the bottom of the flex container */}
    <div className='flex-1 flex flex-col justify-end p-5 pt-2'>{children}</div>
  </div>
);

// The main Feature Bento Grid component
export function FeatureBentoGrid() {
  const container = useRef(null);

  const roadmapTasks = [
    { week: 'Week 1', title: 'Setup & First Script', time: '1.5h', done: true },
    { week: 'Week 1', title: 'Variables & Data Types', time: '4h', done: true },
    { week: 'Week 2', title: 'Loops & Repetition', time: '3h', done: true },
    { week: 'Week 2', title: 'Arrays & Objects', time: '7h', done: false },
    { week: 'Week 3', title: 'DOM Selection', time: '3h', done: false },
    { week: 'Week 3', title: 'DOM Manipulation', time: '4h', done: false },
    { week: 'Week 4', title: 'Project: To-Do List', time: '4h', done: false },
    { week: 'Week 5', title: 'Master ES6+ Features', time: '5h', done: false },
  ];

  const features = [
    {
      className: 'md:col-span-4 md:row-span-2', // Hero card
      title: 'Turn Ambition into Action',
      description:
        'Define your goal and break it down into a clear, scannable roadmap. See your entire plan from start to finish.',
      icon: <Zap size={20} />,
      content: (
        <div className='w-full h-full max-h-[22rem] p-4 bg-muted/50 rounded-lg overflow-y-auto [mask-image:linear-gradient(to_bottom,white_85%,transparent_100%)]'>
          <h4 className='text-sm font-semibold text-foreground mb-3'>
            Goal: Learn JavaScript in 2 Months
          </h4>
          <div className='flex flex-col gap-3'>
            {roadmapTasks.map((task, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 text-sm',
                  task.done && 'text-muted-foreground line-through'
                )}
              >
                {task.done ? (
                  <Check className='size-4 text-primary shrink-0' />
                ) : (
                  <Circle className='size-4 text-border shrink-0' />
                )}
                <span className='flex-1'>{task.title}</span>
                <span className='font-mono text-xs bg-background/50 border border-border/80 rounded px-1.5 py-0.5'>
                  {task.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      className: 'md:col-span-2 md:row-span-2', // Pace indicator gets a prominent spot
      title: 'Data-Driven Confidence',
      description:
        "Know if you're on track to meet your deadline with a simple, at-a-glance pace chart.",
      icon: <ChartLine size={20} />,
      content: (
        <div className='h-full w-full'>
          <PaceIndicatorChart compact />
        </div>
      ),
    },
    {
      className: 'md:col-span-2',
      title: 'AI-Powered Planning',
      description:
        'Describe your project and let AI draft an actionable roadmap in seconds.',
      icon: <Sparkles size={20} />,
      content: (
        <div className='w-full h-full p-4 bg-muted/50 rounded-lg flex flex-col justify-between gap-3'>
          <div className='flex items-center gap-2 text-sm font-semibold p-2 bg-background/70 rounded-md'>
            <Sparkles className='text-primary/80 size-4 shrink-0' />
            <p className='text-foreground truncate'>
              A branding and Webflow project for a coffee shop...
            </p>
          </div>
          <div className='text-sm p-2 rounded-md bg-background/70'>
            <p className='text-muted-foreground'>
              <Check className='inline size-4 mr-1 text-primary' />
              Week 1: Discovery & Brand Strategy
            </p>
            <p className='text-muted-foreground'>
              <Check className='inline size-4 mr-1 text-primary' />
              Week 2: Webflow Development
            </p>
          </div>
        </div>
      ),
    },
    {
      className: 'md:col-span-2',
      title: 'Track Time, See Results',
      description:
        'The core loop: focus on a task, and instantly see your effort recorded on the grid.',
      icon: <ArrowRight size={20} />,
      content: (
        <div className='w-full h-full p-4 bg-muted/50 rounded-lg flex items-center justify-around gap-4'>
          <div className='text-center'>
            <p className='text-3xl font-mono text-primary tabular-nums'>
              45:00
            </p>
            <p className='text-xs text-muted-foreground mt-1'>Focus Session</p>
          </div>
          <ArrowRight className='size-6 text-border shrink-0' />
          <div className='grid grid-cols-4 gap-1.5'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className='size-5 rounded-sm'
                style={{
                  backgroundColor: `hsl(142 71% 45% / ${Math.max(
                    0.1,
                    Math.random() * 0.8
                  )})`,
                }}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      className: 'md:col-span-1',
      title: 'Smart Timers',
      description: 'Pomodoro & idle detection.',
      icon: <Clock size={20} />,
      content: (
        <div className='w-full h-full flex items-center justify-center'>
          <ClockPlusIcon className='size-16 text-primary/20 group-hover:text-primary/40 transition-colors' />
        </div>
      ),
    },
    {
      className: 'md:col-span-1',
      title: 'Celebrate',
      description: 'Share your journey.',
      icon: <Trophy size={20} />,
      content: (
        <div className='w-full h-full flex items-center justify-center'>
          <Trophy className='size-16 text-primary/20 group-hover:text-primary/40 transition-colors' />
        </div>
      ),
    },
  ];

  useGSAP(
    () => {
      gsap.to('.bento-card', {
        opacity: 1,
        stagger: { amount: 0.4, from: 'start' },
        scrollTrigger: {
          trigger: container.current,
          start: 'top 30%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      id='features'
      className='py-24 md:py-32'
      aria-labelledby='features-heading'
    >
      <div className='container mx-auto px-6'>
        <EnterBlur className='text-center mb-16 max-w-3xl mx-auto'>
          <h2
            id='features-heading'
            className='text-4xl md:text-5xl font-bold tracking-tighter'
          >
            Everything you need. Nothing you don't.
          </h2>
          <p className='mt-4 text-lg text-muted-foreground'>
            GridGoal is a powerful, focused system designed to eliminate
            distractions and maximize your productive output.
          </p>
        </EnterBlur>

        <div className='grid grid-cols-1 md:grid-cols-6 auto-rows-[14rem] gap-4'>
          {features.map((feature) => (
            <BentoCard
              key={feature.title}
              className={feature.className}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            >
              {feature.content}
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}
