import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// DELETE /api/daily-queue/[itemId]
export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  await prisma.dailyQueueItem.deleteMany({
    where: { id: params.itemId, userId: session.user.id }, // Ensure user owns the item
  });
  return new NextResponse(null, { status: 204 }); // No Content
}
