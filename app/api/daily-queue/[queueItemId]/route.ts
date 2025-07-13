import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// The parameter name should match the dynamic segment of your file path, e.g., [queueItemId]
export async function DELETE(
  request: Request,
  { params }: { params: { queueItemId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    await prisma.dailyQueueItem.deleteMany({
      where: {
        id: params.queueItemId,
        userId: userId,
      },
    });

    console.log(`Attempted to delete queue item: ${params.queueItemId}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API:DELETE_QUEUE_ITEM]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
