import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// GET /api/daily-queue
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  const queueItems = await prisma.dailyQueueItem.findMany({
    where: { userId: session.user.id },
    include: { task: true }, // Include the full task details
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(queueItems);
}

// POST /api/daily-queue
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  const { taskId } = await request.json();
  if (!taskId) return new NextResponse('Task ID is required', { status: 400 });

  // Get the current max sortOrder to append the new item to the end
  const maxSortOrder = await prisma.dailyQueueItem.aggregate({
    where: { userId: session.user.id },
    _max: { sortOrder: true },
  });

  const newItem = await prisma.dailyQueueItem.create({
    data: {
      userId: session.user.id,
      taskId,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(newItem, { status: 201 });
}
