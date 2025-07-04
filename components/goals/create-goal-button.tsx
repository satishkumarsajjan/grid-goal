'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateGoalButtonProps {
  onClick: () => void;
}

export function CreateGoalButton({ onClick }: CreateGoalButtonProps) {
  return (
    <Button onClick={onClick}>
      <Plus className='-ml-1 mr-2 h-4 w-4' />
      New Goal
    </Button>
  );
}
