import { auth, signOut } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    await prisma.user.delete({
      where: { id: userId },
    });

    await signOut({ redirect: false });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error) {
    console.error('[API:DELETE_USER]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    await prisma.$transaction([
      prisma.userAward.deleteMany({ where: { userId } }),
      prisma.dailyQueueItem.deleteMany({ where: { userId } }),
      prisma.focusSession.deleteMany({ where: { userId } }),
      prisma.task.deleteMany({ where: { userId } }),
      prisma.goal.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId } }),
      prisma.pausePeriod.deleteMany({ where: { userId } }),

      prisma.user.update({
        where: { id: userId },
        data: {
          hasCompletedOnboarding: false,
          lastResetAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account reset successfully.',
    });
  } catch (error) {
    console.error('[API:RESET_USER]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
