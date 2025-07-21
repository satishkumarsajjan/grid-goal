'use client';

import { Progress } from '@/components/ui/progress';

interface GoalProgressBarProps {
  value: number;
}

export function GoalProgressBar({ value }: GoalProgressBarProps) {
  return <Progress value={value} className='h-2' />;
}
