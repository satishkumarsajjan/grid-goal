import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      // --- NEW CASE FOR ONBOARDING ---
      case 'COMPLETE_ONBOARDING':
        await prisma.user.update({
          where: { id: userId },
          data: { hasCompletedOnboarding: true },
        });
        return NextResponse.json({
          success: true,
          message: 'Onboarding completed.',
        });

      case 'COMPLETE_WEEKLY_RESET':
        await prisma.user.update({
          where: { id: userId },
          data: { lastResetAt: new Date() },
        });
        return NextResponse.json({
          success: true,
          message: 'Weekly reset completed.',
        });

      default:
        return new NextResponse(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
        });
    }
  } catch (error) {
    console.error('[API:USER_ACTIONS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
