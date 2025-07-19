import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { isBefore, startOfToday } from 'date-fns'; // Import date-fns helpers

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

    // --- THIS IS THE FIX ---
    // 1. Find the period first to ensure ownership and check its end date.
    const periodToDelete = await prisma.pausePeriod.findFirst({
      where: {
        id: params.periodId,
        userId: userId,
      },
    });

    if (!periodToDelete) {
      // If it doesn't exist or doesn't belong to the user, return 404.
      return new NextResponse(
        JSON.stringify({ error: 'Pause period not found or access denied.' }),
        { status: 404 }
      );
    }

    // 2. Check if the period's end date is in the past.
    if (isBefore(periodToDelete.endDate, startOfToday())) {
      // If it has already ended, forbid deletion to protect historical streak data.
      return new NextResponse(
        JSON.stringify({
          error: 'Cannot delete a pause period that has already ended.',
        }),
        { status: 400 }
      );
    }

    // 3. If all checks pass, proceed with the deletion.
    await prisma.pausePeriod.delete({
      where: {
        id: params.periodId,
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
