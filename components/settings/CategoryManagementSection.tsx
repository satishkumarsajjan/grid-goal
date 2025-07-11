'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Category } from '@prisma/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateCategoryForm } from '@/components/goals/CreateCategoryForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await axios.get('/api/categories');
  return data;
};

const deleteCategory = async (categoryId: string) => {
  return axios.delete(`/api/categories/${categoryId}`);
};

export function CategoryManagementSection() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted.');
      // Refetch categories and goals to update the UI everywhere
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['timeAllocation'] });
      queryClient.invalidateQueries({ queryKey: ['vibeAnalysis'] });
    },
    onError: () => {
      toast.error('Failed to delete category.');
    },
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='space-y-2 mt-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      );
    }

    if (isError) {
      return (
        <p className='text-sm text-destructive mt-4'>
          Failed to load categories.
        </p>
      );
    }

    if (!categories || categories.length === 0) {
      return (
        <p className='text-sm text-muted-foreground mt-4'>
          You have no categories yet.
        </p>
      );
    }

    return (
      <div className='mt-4 space-y-2'>
        {categories.map((category) => (
          <div
            key={category.id}
            className='flex items-center justify-between rounded-md border p-3'
          >
            <span className='font-medium text-sm'>{category.name}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the category. Any goals
                    currently in this category will become uncategorized. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(category.id)}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <CardTitle>Manage Categories</CardTitle>
              <CardDescription>
                Create, edit, and delete your work categories.
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              New Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className='pt-4'>
            <CreateCategoryForm onFinished={() => setIsCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
