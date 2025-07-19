import { auth } from '@/auth';
import { AwardService } from '@/lib/services/award.service';
import { prisma } from '@/prisma';
import { PomodoroCycle, TaskStatus, TimerMode } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const logCycleSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
  taskId: z.string().cuid(),
  goalId: z.string().cuid(),
  mode: z.nativeEnum(TimerMode),
  pomodoroCycle: z.nativeEnum(PomodoroCycle),
  sequenceId: z.string().uuid().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = logCycleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { taskId, goalId, ...sessionData } = validation.data;

    const [newSession] = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId, userId },
      });
      if (!task) throw new Error('Task not found');

      const createdSession = await tx.focusSession.create({
        data: {
          ...sessionData,
          userId,
          taskId,
          goalId,
          noteAccomplished: null,
          noteNextStep: null,
          vibe: null,
        },
      });

      if (sessionData.pomodoroCycle === 'WORK' && task.status === 'PENDING') {
        await tx.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.IN_PROGRESS },
        });
      }

      return [createdSession];
    });

    try {
      await AwardService.processAwards(userId, 'SESSION_SAVED', newSession);
    } catch (awardError) {
      console.error('Failed to process awards for log-cycle:', awardError);
    }

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('[API:LOG_CYCLE]', error);
    if (error instanceof Error && error.message === 'Task not found') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
