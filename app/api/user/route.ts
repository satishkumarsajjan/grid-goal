import { auth, signOut } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

// --- DELETE /api/user (Delete Account) ---
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    // The Prisma schema's onDelete: Cascade will handle deleting all related data.
    // This is a very destructive action.
    await prisma.user.delete({
      where: { id: userId },
    });

    // Sign the user out after their account is deleted.
    // Note: Depending on deployment, signOut might need more config.
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

// --- PATCH /api/user (Reset Account) ---
// We use PATCH here as we are "updating" the user's account state by deleting their data.
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    // This is a complex transaction to delete all user-generated content
    // without deleting the user themselves.
    await prisma.$transaction([
      prisma.userAward.deleteMany({ where: { userId } }),
      prisma.dailyQueueItem.deleteMany({ where: { userId } }),
      prisma.focusSession.deleteMany({ where: { userId } }),
      prisma.task.deleteMany({ where: { userId } }),
      prisma.goal.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId } }),
      prisma.pausePeriod.deleteMany({ where: { userId } }),
      // Reset the user's onboarding status and reset date
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
