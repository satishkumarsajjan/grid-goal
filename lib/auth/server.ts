import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function getSession() {
  try {
    return await auth();
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }
  return session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}