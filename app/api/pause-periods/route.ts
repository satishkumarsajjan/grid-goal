import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

const pausePeriodSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    note: z.string().max(255).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });

// GET /api/pause-periods
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  const periods = await prisma.pausePeriod.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: 'asc' },
  });
  return NextResponse.json(periods);
}

// POST /api/pause-periods
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json();
  const validation = pausePeriodSchema.safeParse(body);
  if (!validation.success) {
    return new NextResponse(
      JSON.stringify({ error: validation.error.format() }),
      { status: 400 }
    );
  }

  const newPeriod = await prisma.pausePeriod.create({
    data: { ...validation.data, userId: session.user.id },
  });
  return NextResponse.json(newPeriod, { status: 201 });
}
