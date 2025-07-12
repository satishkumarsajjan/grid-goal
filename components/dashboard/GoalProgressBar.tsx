'use client';

import { Progress } from '@/components/ui/progress';

interface GoalProgressBarProps {
  value: number; // A number between 0 and 100
}

export function GoalProgressBar({ value }: GoalProgressBarProps) {
  return <Progress value={value} className='h-2' />;
}
