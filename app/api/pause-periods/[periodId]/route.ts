import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { periodId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    await prisma.pausePeriod.deleteMany({
      where: {
        id: params.periodId,
        userId: userId,
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('[API:DELETE_PAUSE_PERIOD]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
