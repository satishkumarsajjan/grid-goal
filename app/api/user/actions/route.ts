import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  const { action } = await request.json();

  if (action === 'COMPLETE_WEEKLY_RESET') {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastResetAt: new Date() },
    });
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse('Invalid action', { status: 400 });
}
