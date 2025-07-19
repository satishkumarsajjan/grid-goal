import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { isBefore, startOfToday } from 'date-fns';
import { NextResponse } from 'next/server';

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

    const periodToDelete = await prisma.pausePeriod.findFirst({
      where: {
        id: params.periodId,
        userId: userId,
      },
    });

    if (!periodToDelete) {
      return new NextResponse(
        JSON.stringify({ error: 'Pause period not found or access denied.' }),
        { status: 404 }
      );
    }

    if (isBefore(periodToDelete.endDate, startOfToday())) {
      return new NextResponse(
        JSON.stringify({
          error: 'Cannot delete a pause period that has already ended.',
        }),
        { status: 400 }
      );
    }

    await prisma.pausePeriod.delete({
      where: {
        id: params.periodId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API:DELETE_PAUSE_PERIOD]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
