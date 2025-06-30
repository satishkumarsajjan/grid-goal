'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Award,
  BarChart4,
  CalendarClock,
  Coffee,
  Construction,
  Goal,
  LucideProps,
  Rocket,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Slide = {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  title: React.ReactNode;
  description: string;
  visual?: React.ReactNode;
};

function RewindPlayer({ title, slides }: { title: string; slides: Slide[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const playerRef = useRef(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSlide = useMemo(() => slides[currentStep], [currentStep, slides]);
  const progressValue = useMemo(
    () => ((currentStep + 1) / slides.length) * 100,
    [currentStep, slides.length]
  );

  const handleNext = () => {
    setIsPaused(true);
    setCurrentStep((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handlePrev = () => {
    setIsPaused(true);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReplay = () => {
    setIsPaused(false);
    setCurrentStep(0);
  };

  useGSAP(
    () => {
      gsap.fromTo(
        '.slide-content',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          key: `slide-${currentStep}-${title}`,
        }
      );

      ScrollTrigger.create({
        trigger: playerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter: () => setIsInView(true),
        onLeave: () => setIsInView(false),
        onEnterBack: () => setIsInView(true),
        onLeaveBack: () => setIsInView(false),
      });
    },
    { scope: playerRef, dependencies: [currentStep] }
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!isPaused && currentStep < slides.length - 1 && isInView) {
      timerRef.current = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, isPaused, slides.length, isInView]);

  return (
    <div ref={playerRef} className='flex flex-col items-center w-full'>
      <h3 className='text-xl font-bold mb-4 tracking-tight'>{title}</h3>
      <div className='w-full max-w-sm h-[650px] bg-card rounded-2xl border-8 border-background shadow-2xl p-4 flex flex-col overflow-hidden relative'>
        <Progress value={progressValue} className='h-1' />

        <div className='flex-1 flex flex-col items-center justify-center text-center px-4'>
          <div className='slide-content w-full'>
            <activeSlide.icon
              className='size-12 text-foreground mx-auto mb-6'
              strokeWidth={1.5}
            />
            <h2 className='text-2xl font-bold text-card-foreground'>
              {activeSlide.title}
            </h2>
            <p className='text-muted-foreground mt-2 text-sm'>
              {activeSlide.description}
            </p>
            {activeSlide.visual}
          </div>
        </div>
        {currentStep < slides.length - 1 ? (
          <>
            <div
              className='absolute left-0 top-0 h-full w-1/2 cursor-pointer'
              onClick={handlePrev}
            />
            <div
              className='absolute right-0 top-0 h-full w-1/2 cursor-pointer'
              onClick={handleNext}
            />
          </>
        ) : (
          <div className='absolute bottom-8 left-1/2 -translate-x-1/2'>
            <Button onClick={handleReplay} variant='secondary'>
              Replay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const monthlyRewindData: Slide[] = [
  {
    icon: Sparkles,
    title: 'Your October Rewind',
    description: 'A look back at your month of incredible progress.',
  },
  {
    icon: Trophy,
    title: (
      <>
        You logged <span className='text-primary'>69 hours</span> of focus.
      </>
    ),
    description: 'That puts you in the top 10% of all users this month!',
  },
  {
    icon: CalendarClock,
    title: (
      <>
        You're a <span className='text-primary'>Night Owl 🦉</span>
      </>
    ),
    description: 'Your most productive hours were between 10 PM and 3 AM.',
  },
  {
    icon: Coffee,
    title: (
      <>
        You showed true <span className='text-primary'>Grit</span>.
      </>
    ),
    description:
      'You even logged 20 minutes on a tough day. That’s commitment.',
  },
  {
    icon: Rocket,
    title: 'Your Monthly Personality:',
    description: 'Based on your recent habits, you are a...',
    visual: (
      <div className='mt-4 flex flex-col items-center gap-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg'>
        <h3 className='text-3xl font-bold'>The Finisher</h3>
        <p className='text-sm text-purple-200'>
          You don't just start things; you see them through to the end.
        </p>
      </div>
    ),
  },
];

const annualRewindData: Slide[] = [
  {
    icon: Sparkles,
    title: 'Your 2025 Rewind',
    description: 'A look back at a year defined by your dedication.',
  },
  {
    icon: Award,
    title: (
      <>
        <span className='text-primary'>420 hours</span> invested in your craft.
      </>
    ),
    description: 'More than 17 full days of focused work this year.',
  },
  {
    icon: Goal,
    title: (
      <>
        You conquered <span className='text-primary'>7 major goals</span>.
      </>
    ),
    description: 'From learning new skills to completing big projects.',
  },
  {
    icon: Zap,
    title: (
      <>
        Longest streak: <span className='text-primary'>69 days</span>.
      </>
    ),
    description: 'An incredible demonstration of pure consistency.',
  },
  {
    icon: BarChart4,
    title: 'Where your time went:',
    description: "Here's the breakdown of your focus this year.",
    visual: (
      <div className='mt-4 flex w-full flex-col items-center gap-4 p-1'>
        <div className='w-full'>
          <div className='flex justify-between items-center mb-1 text-xs text-muted-foreground'>
            <span className='font-medium text-card-foreground'>Web Dev</span>
            <span>60%</span>
          </div>
          <Progress value={60} className='h-2 [&>div]:bg-blue-500' />
        </div>
        <div className='w-full'>
          <div className='flex justify-between items-center mb-1 text-xs text-muted-foreground'>
            <span className='font-medium text-card-foreground'>UI/UX</span>
            <span>30%</span>
          </div>
          <Progress value={30} className='h-2 [&>div]:bg-purple-500' />
        </div>
        <div className='w-full'>
          <div className='flex justify-between items-center mb-1 text-xs text-muted-foreground'>
            <span className='font-medium text-card-foreground'>Growth</span>
            <span>10%</span>
          </div>
          <Progress value={10} className='h-2 [&>div]:bg-emerald-500' />
        </div>
      </div>
    ),
  },
  {
    icon: Construction,
    title: 'Your 2025 Archetype:',
    description: 'Based on a full year of data, your style is clear.',
    visual: (
      <div className='mt-4 flex flex-col items-center gap-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg'>
        <h3 className='text-3xl font-bold'>The Master Builder</h3>
        <p className='text-sm text-orange-200'>
          You build empires of skill, one focused block at a time.
        </p>
      </div>
    ),
  },
];

export function DualRewindSection() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      gsap.from(sectionRef.current, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id='rewind-demos' className='py-24 md:py-32'>
      <div className='container mx-auto px-6'>
        <div className='text-center mb-16 max-w-3xl mx-auto'>
          <h2 className='text-4xl md:text-5xl font-bold tracking-tighter'>
            From Monthly Wins to Yearly Triumphs
          </h2>
          <p className='mt-4 text-lg text-muted-foreground'>
            Celebrate short-term habits with a{' '}
            <span className='font-bold text-foreground'>Monthly Rewind</span>{' '}
            and see the big picture of your dedication with an{' '}
            <span className='font-bold text-foreground'>Annual Rewind</span>.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8'>
          <RewindPlayer title='Monthly Rewind' slides={monthlyRewindData} />
          <RewindPlayer title='Annual Rewind' slides={annualRewindData} />
        </div>
      </div>
    </section>
  );
}
