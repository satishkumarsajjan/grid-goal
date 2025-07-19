import { auth } from '@/auth';
import { AwardService } from '@/lib/services/award.service';
import { prisma } from '@/prisma';
import { startOfToday } from 'date-fns';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const pausePeriodSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    note: z.string().max(255).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be before start date.',
    path: ['endDate'],
  })
  .refine((data) => data.startDate >= startOfToday(), {
    message: 'Start date cannot be in the past.',
    path: ['startDate'],
  });
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return new NextResponse('Unauthorized', { status: 401 });

    const periods = await prisma.pausePeriod.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: 'asc' },
    });
    return NextResponse.json(periods);
  } catch (error) {
    console.error('[API:GET_PAUSE_PERIODS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return new NextResponse('Unauthorized', { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    const validation = pausePeriodSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const newPeriod = await prisma.pausePeriod.create({
      data: { ...validation.data, userId: userId },
    });

    try {
      await AwardService.processAwards(userId, 'PAUSE_CREATED');
    } catch (awardError) {
      console.error('Failed to process pause-creation awards:', awardError);
    }

    return NextResponse.json(newPeriod, { status: 201 });
  } catch (error) {
    console.error('[API:POST_PAUSE_PERIOD]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
