'use client';

import { useAppStore } from '@/store/app-store';
import { type Goal } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { signOutAction } from '@/lib/auth/actions';
import { Home, LogOut, Plus, Rocket, Settings } from 'lucide-react';

const fetchGoalsForCommand = async (): Promise<Goal[]> => {
  const { data } = await axios.get<Goal[]>('/api/goals/tree');
  return data;
};

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, closeCommandPalette, toggleCommandPalette } =
    useAppStore();

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: fetchGoalsForCommand,
  });

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggleCommandPalette]);

  const runCommand = (command: () => void) => {
    closeCommandPalette();
    command();
  };

  return (
    <CommandDialog
      open={isCommandPaletteOpen}
      onOpenChange={closeCommandPalette}
    >
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading='Navigation'>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <Home className='mr-2 h-4 w-4' />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/goals'))}>
            <Rocket className='mr-2 h-4 w-4' />
            <span>Goals & Tasks</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <Settings className='mr-2 h-4 w-4' />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading='Actions'>
          <CommandItem
            onSelect={() => {
              runCommand(() => {
                toast.info("Click the 'New Goal' button to create a new goal.");
                router.push('/goals');
              });
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            <span>Create New Goal</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => signOutAction())}>
            <LogOut className='mr-2 h-4 w-4' />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>

        {/* --- Dynamic Goals Group --- */}
        {goals && goals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading='Go to Goal'>
              {goals
                .filter((g) => g.status === 'ACTIVE')
                .map((goal) => (
                  <CommandItem
                    key={goal.id}
                    onSelect={() =>
                      runCommand(() => router.push(`/goals/${goal.id}`))
                    }
                    value={`Go to Goal ${goal.title}`}
                  >
                    <Rocket className='mr-2 h-4 w-4 text-muted-foreground' />
                    <span>{goal.title}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
