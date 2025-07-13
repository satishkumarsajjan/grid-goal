'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UserAward } from '@prisma/client';
import { AWARDS_METADATA } from '@/lib/constants/awards';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';
import { Trophy } from 'lucide-react';

const fetchAwards = async (): Promise<UserAward[]> => {
  const { data } = await axios.get('/api/awards');
  return data;
};

export function Achievements() {
  const {
    data: awards,
    isLoading,
    isError,
  } = useQuery<UserAward[]>({
    queryKey: ['userAwards'],
    queryFn: fetchAwards,
  });

  const renderContent = () => {
    if (isLoading)
      return (
        <div className='grid grid-cols-4 gap-4'>
          <Skeleton className='h-16 w-16 rounded-lg' />
          <Skeleton className='h-16 w-16 rounded-lg' />
          <Skeleton className='h-16 w-16 rounded-lg' />
          <Skeleton className='h-16 w-16 rounded-lg' />
        </div>
      );
    if (isError)
      return (
        <p className='text-xs text-destructive'>Could not load achievements.</p>
      );
    if (!awards || awards.length === 0) {
      return (
        <div className='text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg'>
          <Trophy className='mx-auto h-8 w-8 mb-2' />
          <p>
            Your first achievement is waiting! Start a focus session or create a
            goal to begin.
          </p>
        </div>
      );
    }

    return (
      <TooltipProvider delayDuration={100}>
        <div className='flex flex-wrap gap-4'>
          {awards.slice(0, 8).map((award) => {
            // Show up to 8 most recent
            const metadata = AWARDS_METADATA[award.awardId];
            if (!metadata) return null;
            const Icon = metadata.icon;

            return (
              <Tooltip key={award.id}>
                <TooltipTrigger asChild>
                  <div className='w-16 h-16 bg-accent/50 rounded-lg flex items-center justify-center border-2 border-primary/20 transition-all hover:border-primary hover:scale-105 cursor-default'>
                    <Icon className='h-8 w-8 text-primary' />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='font-bold'>{metadata.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {metadata.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>
          Celebrating your milestones and consistency.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
