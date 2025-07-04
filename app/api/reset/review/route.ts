import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { GoalStatus } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  // Fetch all goals that are not archived to be reviewed.
  const goalsToReview = await prisma.goal.findMany({
    where: {
      userId: session.user.id,
      status: {
        in: [GoalStatus.ACTIVE, GoalStatus.PAUSED],
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return NextResponse.json(goalsToReview);
}
