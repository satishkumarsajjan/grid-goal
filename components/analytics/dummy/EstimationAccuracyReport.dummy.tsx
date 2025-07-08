// components/analytics/dummy/EstimationAccuracyReport.dummy.tsx
'use client';

import { format } from 'date-fns';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
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

// --- Types and Helpers ---
type EstimationAccuracyData = {
  goalId: string;
  goalTitle: string;
  totalEstimatedSeconds: number;
  totalActualSeconds: number;
  completedAt: Date;
};
const formatSecondsToHM = (s: number) => {
  if (s < 60) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
};

// --- Dummy Data ---
const dummyData: EstimationAccuracyData[] = [
  {
    goalId: '1',
    goalTitle: 'Launch New Landing Page',
    totalEstimatedSeconds: 14400,
    totalActualSeconds: 19800,
    completedAt: new Date('2023-10-28'),
  },
  {
    goalId: '2',
    goalTitle: 'Refactor Authentication Flow',
    totalEstimatedSeconds: 28800,
    totalActualSeconds: 27000,
    completedAt: new Date('2023-10-25'),
  },
  {
    goalId: '3',
    goalTitle: 'Write Q3 Blog Post',
    totalEstimatedSeconds: 7200,
    totalActualSeconds: 7300,
    completedAt: new Date('2023-10-22'),
  },
];

// --- Internal UI Component ---
interface EstimationAccuracyReportUIProps {
  data?: EstimationAccuracyData[];
  isLoading?: boolean;
  isError?: boolean;
}
function EstimationAccuracyReportUI({
  data,
  isLoading,
  isError,
}: EstimationAccuracyReportUIProps) {
  const renderContent = () => {
    if (isLoading) return <ReportSkeleton />;
    if (isError)
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          Could not load estimation report.
        </p>
      );
    if (!data || data.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <Target className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Become a Better Planner</p>
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
                    {format(item.completedAt, 'MMM d, yyyy')}
                  </p>
                </TableCell>
                <TableCell className='text-right'>
                  {formatSecondsToHM(item.totalEstimatedSeconds)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatSecondsToHM(item.totalActualSeconds)}
                </TableCell>
                <TableCell className='flex items-center justify-end text-right '>
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
        <CardDescription>How well do your plans match reality?</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className='p-4 space-y-3'>
      {[1, 2, 3].map((i) => (
        <div key={i} className='flex justify-between items-center'>
          <Skeleton className='h-5 w-2/5' />
          <Skeleton className='h-5 w-1/5' />
          <Skeleton className='h-5 w-1/5' />
        </div>
      ))}
    </div>
  );
}

// --- Exported Dummy Components ---
export const EstimationAccuracyReportWithData = () => (
  <EstimationAccuracyReportUI data={dummyData} />
);
export const EstimationAccuracyReportLoading = () => (
  <EstimationAccuracyReportUI isLoading />
);
export const EstimationAccuracyReportEmpty = () => (
  <EstimationAccuracyReportUI data={[]} />
);
export const EstimationAccuracyReportError = () => (
  <EstimationAccuracyReportUI isError />
);
