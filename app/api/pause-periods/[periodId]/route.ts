import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// DELETE /api/pause-periods/[periodId]
export async function DELETE(
  request: Request,
  { params }: { params: { periodId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  await prisma.pausePeriod.deleteMany({
    where: { id: params.periodId, userId: session.user.id },
  });
  return new NextResponse(null, { status: 204 });
}
