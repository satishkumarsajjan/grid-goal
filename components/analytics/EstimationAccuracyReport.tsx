'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { EstimationAccuracyData } from '@/app/api/analytics/estimation-accuracy/route';

// --- Helper Functions & Constants ---
const formatSecondsToHM = (seconds: number): string => {
  if (seconds < 60) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
};

// --- API Fetcher ---
const fetchEstimationAccuracy = async (): Promise<EstimationAccuracyData[]> => {
  const { data } = await axios.get('/api/analytics/estimation-accuracy');
  return data;
};

// --- Main Component ---
export function EstimationAccuracyReport() {
  const { data, isLoading, isError } = useQuery<EstimationAccuracyData[]>({
    queryKey: ['estimationAccuracy'],
    queryFn: fetchEstimationAccuracy,
  });

  const renderContent = () => {
    if (isLoading) return <ReportSkeleton />;
    if (isError) {
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          Could not load estimation report.
        </p>
      );
    }
    if (!data || data.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <Target className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Become a Better Planner</p>
          <p className='text-sm text-muted-foreground'>
            Estimate time on tasks, then track your focus sessions. Completed
            goals will appear here.
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Completed Goal</TableHead>
            <TableHead className='text-right'>Estimated</TableHead>
            <TableHead className='text-right'>Actual</TableHead>
            <TableHead className='text-right'>Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const variance =
              item.totalActualSeconds - item.totalEstimatedSeconds;
            const variancePercent =
              (variance / item.totalEstimatedSeconds) * 100;
            const isOver = variance > 0;

            return (
              <TableRow key={item.goalId}>
                <TableCell className='font-medium'>
                  <p className='truncate max-w-xs'>{item.goalTitle}</p>
                  <p className='text-xs text-muted-foreground'>
                    {format(new Date(item.completedAt), 'MMM d, yyyy')}
                  </p>
                </TableCell>
                <TableCell className='text-right'>
                  {formatSecondsToHM(item.totalEstimatedSeconds)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatSecondsToHM(item.totalActualSeconds)}
                </TableCell>
                <TableCell className='text-right'>
                  <Badge
                    variant={isOver ? 'destructive' : 'default'}
                    className='flex items-center justify-end gap-1'
                  >
                    {isOver ? (
                      <TrendingUp className='h-3 w-3' />
                    ) : (
                      <TrendingDown className='h-3 w-3' />
                    )}
                    <span>{Math.abs(variancePercent).toFixed(0)}%</span>
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimation Accuracy</CardTitle>
        <CardDescription>
          How well do your plans match reality? Comparing your 10 most recently
          completed goals.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

// --- Skeleton Component ---
function ReportSkeleton() {
  return (
    <div className='p-4 space-y-3'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex justify-between items-center'>
          <Skeleton className='h-5 w-2/5' />
          <Skeleton className='h-5 w-1/5' />
          <Skeleton className='h-5 w-1/5' />
        </div>
      ))}
    </div>
  );
}
