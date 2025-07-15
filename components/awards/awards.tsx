'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { AWARD_CATEGORIES } from '@/lib/constants/awards';
import { useGSAP } from '@gsap/react';
import { UserAward } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import gsap from 'gsap';
import { Trophy } from 'lucide-react';
import { useRef } from 'react';
import { AwardCard } from './award-card';

const fetchAwards = async (): Promise<UserAward[]> => {
  const { data } = await axios.get('/api/awards');
  return data;
};

export function AwardsPage() {
  const container = useRef(null);

  const {
    data: earnedAwards,
    isLoading,
    isError,
  } = useQuery<UserAward[]>({
    queryKey: ['userAwards'],
    queryFn: fetchAwards,
  });

  const earnedAwardIds = new Set(earnedAwards?.map((a) => a.awardId));

  // GSAP animation for the cards
  useGSAP(
    () => {
      if (isLoading) return; // Don't run animation on skeleton

      gsap.fromTo(
        '.award-card',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.05,
        }
      );
    },
    { scope: container, dependencies: [isLoading, earnedAwards] }
  );

  const renderContent = () => {
    if (isLoading) return <AwardsSkeleton />;
    if (isError)
      return (
        <p className='text-destructive'>Could not load your achievements.</p>
      );

    return (
      <div ref={container} className='flex flex-col gap-16'>
        {AWARD_CATEGORIES.map((category) => (
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
                <AwardCard
                  key={award.id}
                  award={award}
                  isUnlocked={earnedAwardIds.has(award.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className='container mx-auto px-6 py-12 md:py-24' id='awards'>
      <div className='text-center mb-16 max-w-3xl mx-auto'>
        <h2 className='text-4xl md:text-5xl font-bold tracking-tighter'>
          A Trophy Case for Your Journey
        </h2>
        <p className='mt-4 text-lg text-muted-foreground'>
          Your hard work doesn't go unnoticed. Unlock awards that celebrate
          every step of your journey, from the first task to total mastery.
        </p>
        {!isLoading && earnedAwards && (
          <div className='mt-6 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-lg'>
            <Trophy className='h-6 w-6' />
            <span>
              {earnedAwardIds.size} /{' '}
              {Object.keys(AWARD_CATEGORIES.flatMap((c) => c.awards)).length}{' '}
              Unlocked
            </span>
          </div>
        )}
      </div>
      {renderContent()}
    </div>
  );
}

function AwardsSkeleton() {
  return (
    <div className='space-y-16'>
      {Array.from({ length: 5 }).map((_, i) => (
        <section key={i}>
          <Skeleton className='h-8 w-1/3 mb-2 md:mx-0 mx-auto' />
          <Skeleton className='h-5 w-2/3 mb-8 md:mx-0 mx-auto' />
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6'>
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className='aspect-square rounded-2xl' />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
