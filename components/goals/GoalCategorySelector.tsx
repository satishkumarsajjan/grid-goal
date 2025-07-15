'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Category, Goal } from '@prisma/client';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type GoalWithCategory = Goal & { category: Category | null };

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await axios.get('/api/categories');
  console.log('FETCH CAT:', data);

  return data;
};

const updateGoalCategory = async ({
  goalId,
  categoryId,
}: {
  goalId: string;
  categoryId: string | null;
}) => {
  const { data } = await axios.patch(`/api/goals/${goalId}`, { categoryId });
  console.log('UPDATE GOAL CAT:', data);

  return data;
};

interface GoalCategorySelectorProps {
  goal: GoalWithCategory;
  onOpenCreateCategoryDialog: () => void;
}

export function GoalCategorySelector({
  goal,
  onOpenCreateCategoryDialog,
}: GoalCategorySelectorProps) {
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const mutation = useMutation({
    mutationFn: updateGoalCategory,
    onSuccess: () => {
      toast.success(`Goal category updated.`);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', goal.id] });
      queryClient.invalidateQueries({ queryKey: ['timeAllocation'] });
      queryClient.invalidateQueries({ queryKey: ['vibeAnalysis'] });
    },
    onError: () => {
      toast.error('Failed to update category.');
    },
  });

  const handleSelect = (newCategoryId: string) => {
    if (newCategoryId === '__CREATE_NEW__') {
      onOpenCreateCategoryDialog();
      return;
    }

    const finalId =
      newCategoryId === '__UNCATEGORIZED__' ? null : newCategoryId;
    console.log('FINALID:', finalId);

    mutation.mutate({ goalId: goal.id, categoryId: finalId });
  };

  if (isLoading) {
    return <Skeleton className='h-9 w-48' />;
  }

  return (
    <div className='flex items-center gap-2 text-sm'>
      <span className='text-muted-foreground'>Category:</span>
      <Select
        value={goal.categoryId || '__UNCATEGORIZED__'}
        onValueChange={handleSelect}
        disabled={mutation.isPending}
      >
        <SelectTrigger className='w-[180px] h-9'>
          <SelectValue placeholder='Uncategorized' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='__UNCATEGORIZED__' className='italic'>
            Uncategorized
          </SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant='outline'
        size='sm'
        className='h-9'
        onClick={onOpenCreateCategoryDialog}
      >
        + New
      </Button>
    </div>
  );
}
