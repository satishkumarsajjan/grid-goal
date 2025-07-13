'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import type {
  EstimationAccuracyItem,
  EstimationAccuracyResponse,
} from '@/app/api/analytics/estimation-accuracy/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { InsightTooltip } from './InsightTooltip';

type ProcessedAccuracyItem = EstimationAccuracyItem & {
  variancePercent: number | null;
  isOver: boolean;
  wasEstimated: boolean; // NEW: Flag to track if an estimate was made
};

const formatSecondsToHM = (seconds: number): string => {
  if (seconds < 60) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
};

const fetchEstimationAccuracy = async (
  page: number
): Promise<EstimationAccuracyResponse> => {
  const { data } = await axios.get(
    `/api/analytics/estimation-accuracy?page=${page}`
  );
  return data;
};

export function EstimationAccuracyReport() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError } = useQuery<EstimationAccuracyResponse>({
    queryKey: ['estimationAccuracy', currentPage],
    queryFn: () => fetchEstimationAccuracy(currentPage),
    placeholderData: (previousData) => previousData,
  });

  const processedData: ProcessedAccuracyItem[] | null = useMemo(() => {
    if (!data?.data) return null;
    return data.data.map((item) => {
      const wasEstimated = item.totalEstimatedSeconds > 0;
      if (!wasEstimated) {
        return {
          ...item,
          variancePercent: null,
          isOver: item.totalActualSeconds > 0,
          wasEstimated,
        };
      }
      const variance = item.totalActualSeconds - item.totalEstimatedSeconds;
      const variancePercent = (variance / item.totalEstimatedSeconds) * 100;
      return { ...item, variancePercent, isOver: variance > 0, wasEstimated };
    });
  }, [data]);

  const averageAccuracy = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;
    const itemsWithVariance = processedData.filter(
      (p) => p.variancePercent !== null
    );
    if (itemsWithVariance.length === 0) return null;
    const totalVariance = itemsWithVariance.reduce(
      (acc, item) => acc + item.variancePercent!,
      0
    );
    return totalVariance / itemsWithVariance.length;
  }, [processedData]);

  const renderContent = () => {
    if (isLoading && !processedData) return <ReportSkeleton />;
    if (isError)
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          Could not load estimation report.
        </p>
      );
    if (!processedData || processedData.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <Target className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Become a Better Planner</p>
          <p className='text-sm text-muted-foreground'>
            Estimate time on tasks, then track your focus. Completed goals will
            appear here.
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
          {processedData.map((item) => (
            <TableRow
              key={item.goalId}
              className={isLoading ? 'opacity-50' : ''}
            >
              <TableCell scope='row' className='font-medium'>
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
              <TableCell className='text-right flex items-center justify-end'>
                {!item.wasEstimated ? (
                  <Badge variant='outline' className='text-muted-foreground'>
                    Not Estimated
                  </Badge>
                ) : item.variancePercent === null ? (
                  '—'
                ) : (
                  <Badge
                    variant={item.isOver ? 'destructive' : 'default'}
                    className='flex items-center justify-end gap-1'
                  >
                    {item.isOver ? (
                      <TrendingUp className='h-3 w-3' />
                    ) : (
                      <TrendingDown className='h-3 w-3' />
                    )}
                    <span className='sr-only'>
                      {item.isOver ? 'Over estimate by' : 'Under estimate by'}
                    </span>
                    <span>{Math.abs(item.variancePercent).toFixed(0)}%</span>
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const pageCount = data ? Math.ceil(data.totalCount / 10) : 0;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Estimation Accuracy</CardTitle>
          <InsightTooltip
            content={
              <p>
                This report compares your estimated time against the actual time
                you spent on completed goals. Use this feedback to improve your
                planning skills, set more realistic deadlines, and reduce the
                stress of falling behind.
              </p>
            }
          />
        </div>
        <CardDescription>
          Review your planning accuracy to make more realistic estimates in the
          future.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* --- FIX: Move summary to a more prominent position --- */}
        {averageAccuracy !== null && (
          <div className='text-sm text-muted-foreground border-l-4 rounded p-3 mb-4 bg-muted/50'>
            On average, you tend to{' '}
            <strong
              className={cn(
                averageAccuracy > 0 ? 'text-destructive' : 'text-green-600'
              )}
            >
              {averageAccuracy > 0 ? 'underestimate' : 'overestimate'}
            </strong>{' '}
            by{' '}
            <strong className='text-foreground'>
              {Math.abs(averageAccuracy).toFixed(0)}%
            </strong>
            .
          </div>
        )}
        {renderContent()}
      </CardContent>
      <CardFooter>
        {pageCount > 1 && (
          // --- FIX: Use buttons for pagination actions for better a11y ---
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <PaginationPrevious className='static' />
                </Button>
              </PaginationItem>
              {/* Note: A more complex pagination would render page numbers here */}
              <PaginationItem>
                <Button variant='outline' size='sm' className='cursor-default'>
                  Page {currentPage} of {pageCount}
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pageCount, p + 1))
                  }
                  disabled={currentPage >= pageCount || isLoading}
                >
                  <PaginationNext className='static' />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className='p-4 space-y-3'>
      <div className='w-full space-y-1 bg-muted/50 p-3 rounded'>
        <Skeleton className='h-4 w-3/4' />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex justify-between items-center'>
          <div className='w-2/5 space-y-1'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-3 w-1/2' />
          </div>
          <Skeleton className='h-5 w-1/6' />
          <Skeleton className='h-5 w-1/6' />
          <Skeleton className='h-5 w-1/6' />
        </div>
      ))}
    </div>
  );
}
