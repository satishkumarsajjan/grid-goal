// components/analytics/dummy/EstimationAccuracyReport.dummy.tsx
'use client';

import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';

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

// --- Types and Helpers (Copied from the real component) ---
type EstimationAccuracyItem = {
  goalId: string;
  goalTitle: string;
  totalEstimatedSeconds: number;
  totalActualSeconds: number;
  completedAt: Date;
};
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

// --- Dummy Data ---
// This simulates a user who generally underestimates their tasks.
const dummyData: EstimationAccuracyItem[] = [
  {
    goalId: '1',
    goalTitle: 'Launch New Landing Page',
    totalEstimatedSeconds: 14400,
    totalActualSeconds: 19800,
    completedAt: new Date('2023-10-28'),
  }, // +37.5%
  {
    goalId: '2',
    goalTitle: 'Refactor Authentication Flow',
    totalEstimatedSeconds: 28800,
    totalActualSeconds: 27000,
    completedAt: new Date('2023-10-25'),
  }, // -6.25%
  {
    goalId: '3',
    goalTitle: 'Write Q3 Blog Post',
    totalEstimatedSeconds: 7200,
    totalActualSeconds: 7300,
    completedAt: new Date('2023-10-22'),
  }, // +1.4%
  {
    goalId: '4',
    goalTitle: 'Deploy Security Patches',
    totalEstimatedSeconds: 3600,
    totalActualSeconds: 5400,
    completedAt: new Date('2023-10-20'),
  }, // +50%
  // This item tests the "division by zero" bug fix
  {
    goalId: '5',
    goalTitle: 'Quick Unplanned Hotfix',
    totalEstimatedSeconds: 0,
    totalActualSeconds: 1800,
    completedAt: new Date('2023-10-19'),
  }, // Should show '—'
];
const dummyTotalCount = 25; // To test pagination

// --- Internal UI Component (Purely for Presentation) ---
interface EstimationAccuracyReportUIProps {
  data?: EstimationAccuracyItem[];
  totalCount?: number;
  isLoading?: boolean;
  isError?: boolean;
}
function EstimationAccuracyReportUI({
  data,
  totalCount = 0,
  isLoading,
  isError,
}: EstimationAccuracyReportUIProps) {
  const processedData: ProcessedAccuracyItem[] | null = useMemo(() => {
    if (!data) return null;
    return data.map((item) => {
      if (item.totalEstimatedSeconds === 0)
        return {
          ...item,
          variancePercent: null,
          isOver: item.totalActualSeconds > 0,
        };
      const variance = item.totalActualSeconds - item.totalEstimatedSeconds;
      const variancePercent = (variance / item.totalEstimatedSeconds) * 100;
      return { ...item, variancePercent, isOver: variance > 0 };
    });
  }, [data]);

  const averageAccuracy = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;
    const totalVariance = processedData.reduce(
      (acc, item) =>
        item.variancePercent !== null ? acc + item.variancePercent : acc,
      0
    );
    const validItems = processedData.filter(
      (p) => p.variancePercent !== null
    ).length;
    return validItems > 0 ? totalVariance / validItems : 0;
  }, [processedData]);

  const renderContent = () => {
    if (isLoading) return <ReportSkeleton />;
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
            Estimate time on tasks, then track your focus.
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
            <TableRow key={item.goalId}>
              <TableCell scope='row' className='font-medium'>
                <p className='truncate max-w-xs'>{item.goalTitle}</p>
                <p className='text-xs text-muted-foreground'>
                  {format(item.completedAt, 'MMM d, yyyy')}
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
  const pageCount = Math.ceil(totalCount / 10);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimation Accuracy</CardTitle>
        <CardDescription>
          Review your planning accuracy to make more realistic estimates.
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
                <PaginationPrevious href='#' />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href='#'>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href='#'>{pageCount}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href='#' />
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

// --- EXPORTED DUMMY COMPONENTS FOR TESTING ---

/** Displays the report with a full set of insightful data, including the summary and pagination. */
export const EstimationAccuracyReportWithData = () => (
  <EstimationAccuracyReportUI data={dummyData} totalCount={dummyTotalCount} />
);

/** Displays the report in its loading state. */
export const EstimationAccuracyReportLoading = () => (
  <EstimationAccuracyReportUI isLoading />
);

/** Displays the report when there is no data to show. */
export const EstimationAccuracyReportEmpty = () => (
  <EstimationAccuracyReportUI data={[]} />
);

/** Displays the report in an error state. */
export const EstimationAccuracyReportError = () => (
  <EstimationAccuracyReportUI isError />
);
