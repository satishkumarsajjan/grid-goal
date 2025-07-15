import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const settingsSchema = z.object({
  dailyFocusGoalMinutes: z.number().int().min(0).max(1440), // Allow 0 to 24 hours
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyFocusGoalMinutes: validation.data.dailyFocusGoalMinutes,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API:UPDATE_USER_SETTINGS]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
