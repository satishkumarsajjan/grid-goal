import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// POST /api/daily-queue/bulk-actions
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  const { action } = await request.json();

  if (action === 'CLEAR_ALL') {
    await prisma.dailyQueueItem.deleteMany({
      where: { userId: session.user.id },
    });
    return new NextResponse(null, { status: 204 });
  }

  if (action === 'RESET_DATES') {
    // This action updates the createdAt timestamp of all queue items to "now",
    // effectively making yesterday's queue today's queue.
    await prisma.dailyQueueItem.updateMany({
      where: { userId: session.user.id },
      data: { createdAt: new Date() },
    });
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse('Invalid action', { status: 400 });
}
