import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    const awards = await prisma.userAward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(awards);
  } catch (error) {
    console.error('[API:GET_AWARDS]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
