'use client'; // This is a client component because it uses a dropdown menu with state.

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Using Shadcn's Avatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Using Shadcn's DropdownMenu
import { signOutAction } from '@/lib/auth/actions';
import { LogOut } from 'lucide-react';
import { type User } from 'next-auth';

interface UserButtonProps {
  user: User;
}

export function UserButton({ user }: UserButtonProps) {
  // Get the user's initials for the avatar fallback
  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='flex w-full items-center gap-2 rounded-md p-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200 dark:hover:bg-gray-700'>
          <Avatar className='h-8 w-8'>
            {/* 
              The user.image comes from the Google/GitHub profile.
              If it exists, we show it.
            */}
            <AvatarImage src={user.image ?? ''} alt={user.name ?? ''} />
            {/* 
              If there's no image, we show a fallback with the user's initials.
              This makes it work great even for email/password users.
            */}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className='truncate'>{user.name ?? 'User'}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>
              {user.name ?? 'User'}
            </p>
            <p className='text-xs leading-none text-muted-foreground'>
              {user.email ?? ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          {/* 
            We use a form here to call the signOutAction. This is the
            best practice for actions that cause a mutation or state change.
          */}
          <form action={signOutAction} className='w-full'>
            <button type='submit' className='flex w-full items-center'>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Log out</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
