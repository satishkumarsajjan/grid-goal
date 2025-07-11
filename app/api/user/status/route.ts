import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        hasCompletedOnboarding: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    });
  } catch (error) {
    console.error('[API:USER_STATUS]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
