'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Archive,
  CalendarDays,
  Dot,
  Flame,
  Lightbulb,
  Repeat,
  Target,
  Timer,
  Trophy,
} from 'lucide-react';
import { useRef } from 'react';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

export function VisualWorkflowSection() {
  const container = useRef(null);

  const steps = [
    {
      step: 'Step 1: Architect Your Goal',
      title: 'Plan with Clarity',
      description:
        'A great goal needs a great plan. Break down your ambition into a clear, nested roadmap of goals and actionable tasks.',
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col gap-2.5 text-sm'>
          <div className='flex items-start gap-2'>
            <Target className='text-primary size-5 mt-0.5 shrink-0' />
            <div className='flex flex-col'>
              <p className='font-semibold'>Master JavaScript in 2 Months</p>
              <p className='text-xs text-muted-foreground'>
                Goal Deadline: 60 days
              </p>
            </div>
          </div>
          <div className='flex items-start gap-2 pl-4'>
            <Dot className='text-primary/70 size-5 mt-0.5 shrink-0' />
            <p className='font-medium text-muted-foreground'>
              Week 1-2: The Fundamentals
            </p>
          </div>
          <div className='flex items-start gap-2 pl-8'>
            <div className='size-3.5 border-2 border-border rounded-full mt-1 shrink-0' />
            <p className='text-foreground'>
              Complete FreeCodeCamp on Functions
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 2: The Daily Ritual',
      title: 'Ignite Daily Momentum',
      description:
        'Start each day with a clear purpose. Your streak and daily target are front and center, motivating you to show up consistently.',
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col sm:flex-row items-center justify-around gap-4'>
          <div className='text-center'>
            <p className='font-semibold text-base'>Daily Target</p>
            <div className='relative size-20 mt-1'>
              <svg className='size-full' viewBox='0 0 100 100'>
                <circle
                  className='stroke-border'
                  strokeWidth='8'
                  cx='50'
                  cy='50'
                  r='42'
                  fill='transparent'
                />
                <circle
                  className='stroke-primary'
                  strokeWidth='8'
                  cx='50'
                  cy='50'
                  r='42'
                  fill='transparent'
                  strokeDasharray='264'
                  strokeDashoffset='132'
                  strokeLinecap='round'
                  transform='rotate(-90 50 50)'
                />
              </svg>
              <div className='absolute inset-0 flex items-center justify-center text-md font-bold'>
                45/90m
              </div>
            </div>
          </div>
          <div className='text-center'>
            <p className='font-semibold text-base'>Current Streak</p>
            <div className='flex items-center justify-center gap-2 mt-1'>
              <Flame className='size-10 text-orange-500' />
              <span className='text-4xl font-bold text-foreground'>14</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 3: Deep Work',
      title: 'Execute with Focus',
      description:
        'Start the timer and get to work. Zen Mode fades out all distractions, helping you achieve a state of deep, uninterrupted focus.',
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col items-center justify-center gap-2 text-center'>
          <p className='font-medium text-muted-foreground text-sm'>
            Focusing on: Read MDN on Variables
          </p>
          <p className='text-5xl sm:text-6xl font-mono text-foreground tabular-nums tracking-tighter'>
            00:44:59
          </p>
          <div className='flex items-center gap-2 text-xs sm:text-sm text-primary font-semibold border border-primary/50 bg-primary/10 px-3 py-1 rounded-full'>
            <Timer className='size-4' />
            <span>Zen Mode Active</span>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 4: The Perfect Handoff',
      title: 'Log Progress, Cue Tomorrow',
      description:
        "After each session, log what you did and, crucially, what's next. This simple habit eliminates friction and sets up your future self for success.",
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col gap-3 justify-center'>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>
              What I Accomplished:
            </label>
            <p className='p-2 mt-1 bg-background rounded border border-border/50 text-sm'>
              Finished reading about var, let, and const. Scope makes sense now.
            </p>
          </div>
          <div>
            <label className='text-sm font-medium text-primary'>
              My Next Step Is:
            </label>
            <p className='p-2 mt-1 bg-background rounded border border-primary/50 text-sm'>
              Start the FreeCodeCamp exercises on Functions tomorrow.
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 5: See Your Effort',
      title: 'Visualize Your Consistency',
      description:
        "Every completed session fills a square on your Momentum Grid. This isn't just a chart; it's the honest, visual proof of your hard work.",
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex items-center justify-center'>
          <div className='grid grid-cols-10 grid-rows-6 gap-1.5'>
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className={`size-5 rounded-sm ${
                  i < 15 && Math.random() > 0.2
                    ? 'bg-green-600/90'
                    : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      step: 'Step 6: Handle Interruptions',
      title: 'Rest Without Losing Momentum',
      description:
        'Life happens. Activate Vacation Mode to pause your goal and protect your streak. Rest guilt-free, knowing your hard-earned momentum is safe.',
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col gap-3 justify-center'>
          <div className='flex items-center justify-between'>
            <p className='font-semibold'>Protect Your Streak</p>
            <div className='flex items-center space-x-2'>
              <Label htmlFor='vacation-mode'>Vacation Mode</Label>
              <Switch id='vacation-mode' />
            </div>
          </div>
          <div className='grid grid-cols-7 grid-rows-2 gap-1.5 p-2 mt-1 border border-border/50 rounded bg-background'>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className='size-6 rounded-sm bg-green-600/90' />
            ))}
            {[5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className='size-6 rounded-sm bg-blue-500/20 flex items-center justify-center'
              >
                <CalendarDays className='size-4 text-blue-500' />
              </div>
            ))}
            {[9, 10, 11, 12, 13].map((i) => (
              <div key={i} className='size-6 rounded-sm bg-border' />
            ))}
          </div>
        </div>
      ),
    },
    {
      step: 'Step 7: Diagnose & Adapt',
      title: 'Turn Roadblocks into Data',
      description:
        "Feeling stuck? Filter your grid and time logs to see where you're avoiding work or spinning your wheels. A patchy grid is a signal to adapt your plan.",
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col gap-3 justify-center'>
          <div className='flex items-center gap-2'>
            <Lightbulb className='text-primary size-5' />
            <p className='font-semibold'>Diagnosis: Async & APIs</p>
          </div>
          <div className='grid grid-cols-7 grid-rows-2 gap-1.5 p-2 border border-border/50 rounded bg-background'>
            {[2, 5, 6, 9, 10, 11].map((i) => (
              <div key={i} className='size-4 rounded-sm bg-border' />
            ))}
            {[0, 1, 3, 4, 7, 8, 12, 13].map((i) => (
              <div key={i} className='size-4 rounded-sm bg-green-600/90' />
            ))}
          </div>
          <div className='mt-1'>
            <p className='text-sm font-medium text-muted-foreground'>
              Task Time Accumulation:
            </p>
            <p className='text-xs'>
              - Callbacks:{' '}
              <span className='font-semibold text-foreground'>4 hours</span>{' '}
              (stuck)
            </p>
            <p className='text-xs'>
              - Promises:{' '}
              <span className='font-semibold text-foreground'>30 minutes</span>{' '}
              (avoiding)
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 8: Race to the Finish',
      title: 'Stay on Pace to Win',
      description:
        "The Pace Indicator shows if you're on track to meet your deadline. Seeing your actual progress versus the ideal path provides the perfect motivation to catch up.",
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col items-center justify-center gap-2'>
          <div className='w-full max-w-sm'>
            <div className='flex justify-between items-baseline'>
              <p className='font-semibold'>Pace Indicator</p>
              <p className='text-sm text-red-500 font-medium'>2h behind</p>
            </div>
            <div className='w-full h-28 mt-1 relative'>
              <svg
                width='100%'
                height='100%'
                viewBox='0 0 300 100'
                preserveAspectRatio='none'
              >
                <path
                  d='M 0 90 C 50 80, 100 70, 300 10'
                  stroke='var(--border)'
                  strokeWidth='2'
                  fill='none'
                  strokeDasharray='4'
                />
                <path
                  d='M 0 90 C 50 85, 100 80, 150 70 C 200 75, 250 60, 270 50'
                  stroke='var(--primary)'
                  strokeWidth='3'
                  fill='none'
                />
                <circle cx='270' cy='50' r='4' fill='var(--primary)' />
              </svg>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 9: The Payoff & Next Quest',
      title: 'Celebrate, Reflect, Repeat',
      description:
        'Complete your goal to unlock a shareable snapshot of your achievement. Reflect on your journey, then archive your win and start the next adventure.',
      visual: (
        <div className='w-full h-full p-4 bg-background/50 rounded-lg flex flex-col items-center justify-center gap-2 border-2 border-amber-400/50'>
          <Trophy
            className='size-10 text-amber-400'
            strokeWidth={1.5}
            fill='rgba(251, 191, 36, 0.2)'
          />
          <p className='text-xl font-bold tracking-tight'>Goal Complete!</p>
          <p className='text-muted-foreground -mt-1 text-sm text-center'>
            Frodo invested{' '}
            <span className='text-foreground font-semibold'>84 hours</span> to
            Master JavaScript.
          </p>
          <div className='text-xs bg-muted/50 px-2 py-1 rounded'>
            Productivity Personality:{' '}
            <span className='font-semibold text-foreground'>The Finisher</span>
          </div>
          <div className='flex items-center gap-2 mt-2 text-sm text-muted-foreground border-t border-border pt-2 w-full justify-center'>
            <Archive className='size-4' />
            <button className='text-primary font-semibold flex items-center gap-1'>
              <Repeat className='size-4' /> Start New Goal
            </button>
          </div>
        </div>
      ),
    },
  ];

  useGSAP(
    () => {
      gsap.from('.workflow-card', {
        opacity: 0,
        y: 50,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: container.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: container }
  );

  return (
    <section
      id='workflow'
      className='py-24 md:py-32'
      aria-labelledby='workflow-heading'
    >
      <div className='container mx-auto px-6'>
        <div className='text-center mb-16 max-w-3xl mx-auto'>
          <h2
            id='workflow-heading'
            className='text-4xl md:text-5xl font-bold tracking-tighter'
          >
            From First Step to Final Victory
          </h2>
          <p className='mt-4 text-lg text-muted-foreground'>
            A complete workflow designed for real life. Explore the key features
            that help you plan, execute, adapt, and achieve any goal.
          </p>
        </div>

        <div
          ref={container}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
        >
          {steps.map((step) => (
            <div
              key={step.title}
              className='workflow-card flex flex-col h-full gap-4 p-6 border border-border rounded-2xl bg-muted/30 backdrop-blur-sm'
            >
              <div className='text-left'>
                <p className='text-primary font-semibold text-sm'>
                  {step.step}
                </p>
                <h3 className='mt-1 text-xl font-bold tracking-tight'>
                  {step.title}
                </h3>
                <p className='mt-2 text-muted-foreground text-sm'>
                  {step.description}
                </p>
              </div>

              <div className='flex-1 flex w-full min-h-[200px] rounded-lg border border-border/50 bg-background shadow-inner shadow-black/5'>
                {step.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
