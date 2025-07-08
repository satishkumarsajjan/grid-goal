'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type {
  EstimationAccuracyResponse,
  EstimationAccuracyItem,
} from '@/app/api/analytics/estimation-accuracy/route';
import { InsightTooltip } from './InsightTooltip';

type ProcessedAccuracyItem = EstimationAccuracyItem & {
  variancePercent: number | null;
  isOver: boolean;
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
      if (item.totalEstimatedSeconds === 0) {
        return {
          ...item,
          variancePercent: null,
          isOver: item.totalActualSeconds > 0,
        };
      }
      const variance = item.totalActualSeconds - item.totalEstimatedSeconds;
      const variancePercent = (variance / item.totalEstimatedSeconds) * 100;
      return { ...item, variancePercent, isOver: variance > 0 };
    });
  }, [data]);

  // IMPROVEMENT: Overall "Net Score" calculation
  const averageAccuracy = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;
    const totalVariance = processedData.reduce((acc, item) => {
      if (item.variancePercent !== null) return acc + item.variancePercent;
      return acc;
    }, 0);
    return (
      totalVariance /
      processedData.filter((p) => p.variancePercent !== null).length
    );
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
              {/* IMPROVEMENT: Added scope="row" for better a11y */}
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
              <TableCell className='text-right'>
                {item.variancePercent === null ? (
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
                    {/* IMPROVEMENT: Added sr-only text for a11y */}
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
      <CardContent>{renderContent()}</CardContent>
      <CardFooter className='flex flex-col items-center gap-4'>
        {averageAccuracy !== null && (
          <div className='text-sm text-muted-foreground'>
            On average, you tend to{' '}
            <span
              className={`font-semibold ${
                averageAccuracy > 0 ? 'text-destructive' : 'text-green-600'
              }`}
            >
              {averageAccuracy > 0 ? 'underestimate' : 'overestimate'}
            </span>{' '}
            by{' '}
            <span className='font-bold'>
              {Math.abs(averageAccuracy).toFixed(0)}%
            </span>
            .
          </div>
        )}
        {pageCount > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href='#'>{currentPage}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.min(pageCount, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
}

// --- Skeleton Component ---
function ReportSkeleton() {
  return (
    <div className='p-4 space-y-3'>
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
