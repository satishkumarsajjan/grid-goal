'use client';

import { AWARD_CATEGORIES } from '@/lib/constants/awards';
import { UserAward } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, Trophy } from 'lucide-react';
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
import { Skeleton } from '../ui/skeleton';

const fetchAwards = async (): Promise<UserAward[]> => {
  const { data } = await axios.get('/api/awards');
  return data;
};

const ALL_AWARDS = AWARD_CATEGORIES.flatMap((category) => category.awards);
const ALL_AWARD_IDS = ALL_AWARDS.map((a) => a.id);

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

    const recentUnlocked =
      earnedAwards?.slice(0, 4).map((a) => a.awardId) || [];

    const nextUpLocked = ALL_AWARD_IDS.filter(
      (id) => !earnedAwardIds.has(id)
    ).slice(0, 4);

    const awardsToShow = [...recentUnlocked, ...nextUpLocked];

    if (awardsToShow.length === 0) {
      return (
        <div className='text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg'>
          <Trophy className='mx-auto h-8 w-8 mb-2' />
          <p>
            Your first achievement is waiting! Start a focus session to begin.
          </p>
        </div>
      );
    }

    return (
      <div className='flex flex-wrap gap-3'>
        {awardsToShow.map((awardId) => (
          <MiniAwardIcon
            key={awardId}
            awardId={awardId}
            isUnlocked={earnedAwardIds.has(awardId)}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Achievements</CardTitle>
          {!isLoading && earnedAwards && (
            <span className='text-sm font-bold text-amber-600 dark:text-amber-500'>
              {earnedAwards.length} / {ALL_AWARD_IDS.length}
            </span>
          )}
        </div>
        <CardDescription>
          Celebrating your milestones and consistency.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-grow'>{renderContent()}</CardContent>
      <div className='p-4 border-t'>
        <Button variant='secondary' className='w-full' asChild>
          <Link href='/awards'>
            View All Achievements <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function AchievementsSkeleton() {
  return (
    <div className='flex flex-wrap gap-3'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className='h-12 w-12 rounded-full' />
      ))}
    </div>
  );
}
