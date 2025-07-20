'use client';

import { AWARD_CATEGORIES } from '@/lib/constants/awards';
import { UserAward } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MiniAwardIcon } from '../awards/MiniAwardIcon';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';

const fetchAwards = async (): Promise<UserAward[]> => {
  const { data } = await axios.get('/api/awards');
  return data;
};

const ALL_AWARDS = AWARD_CATEGORIES.flatMap((category) => category.awards);
const ALL_AWARD_IDS = ALL_AWARDS.map((a) => a.id);
const TOTAL_AWARD_COUNT = ALL_AWARD_IDS.length;

export function Achievements() {
  const {
    data: earnedAwards,
    isLoading,
    isError,
  } = useQuery<UserAward[]>({
    queryKey: ['userAwards'],
    queryFn: fetchAwards,
  });

  const renderContent = () => {
    if (isLoading) return <AchievementsSkeleton />;
    if (isError)
      return (
        <p className='text-xs text-destructive'>Could not load achievements.</p>
      );

    const earnedAwardIds = new Set(earnedAwards?.map((a) => a.awardId) || []);

    // --- THIS IS THE FIX ---
    // 1. Get the list of earned awards in the order they were received (most recent first).
    const unlockedAwards = earnedAwards?.map((a) => a.awardId) || [];

    // 2. Get the list of all awards that have NOT been earned.
    const lockedAwards = ALL_AWARD_IDS.filter((id) => !earnedAwardIds.has(id));

    // 3. Combine them into a single list: unlocked first, then locked.
    const awardsToDisplay = [...unlockedAwards, ...lockedAwards];

    if (awardsToDisplay.length === 0) {
      return (
        <div className='flex items-center justify-center h-full text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg'>
          {/* This state should ideally not happen if there are always awards to be earned */}
          <p>No achievements to display.</p>
        </div>
      );
    }

    return (
      <ScrollArea className='h-45 w-full'>
        <div className='flex flex-wrap gap-3 pr-4'>
          {awardsToDisplay.map((awardId) => (
            <MiniAwardIcon
              key={awardId}
              awardId={awardId}
              isUnlocked={earnedAwardIds.has(awardId)}
            />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Achievements</CardTitle>
          {!isLoading && earnedAwards && (
            <span className='text-sm font-bold text-amber-600 dark:text-amber-500'>
              {earnedAwards.length} / {TOTAL_AWARD_COUNT}
            </span>
          )}
        </div>
        <CardDescription>
          Your unlocked milestones and what&apos;s next.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-grow'>{renderContent()}</CardContent>
      <div className='p-4 border-t mt-auto'>
        <Button variant='secondary' className='w-full' asChild>
          <Link href='/awards'>
            View Full Trophy Case <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function AchievementsSkeleton() {
  return (
    <div className='flex flex-wrap gap-3'>
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className='h-12 w-12 rounded-full' />
      ))}
    </div>
  );
}
