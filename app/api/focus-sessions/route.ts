import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
// Import the enums from Prisma client to use them in Zod
import {
  SessionVibe,
  TaskStatus,
  TimerMode,
  PomodoroCycle,
} from '@prisma/client';

// FIX: Update the Zod schema to include the missing fields
const createFocusSessionSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
  taskId: z.string().cuid(),
  goalId: z.string().cuid(),
  noteAccomplished: z.string().max(10000).optional().nullable(),
  noteNextStep: z.string().max(10000).optional().nullable(),
  artifactUrl: z.string().url().optional().nullable(),
  vibe: z.nativeEnum(SessionVibe).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),

  // These were the missing properties.
  // We make them optional because a STOPWATCH session won't have a pomodoroCycle.
  mode: z.nativeEnum(TimerMode).optional().default('STOPWATCH'),
  pomodoroCycle: z.nativeEnum(PomodoroCycle).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = createFocusSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Now, `mode` and `pomodoroCycle` will be correctly included in `validation.data`
    const { taskId, goalId, tags, ...sessionData } = validation.data;

    const [newSession] = await prisma.$transaction(async (tx) => {
      // Security Check: Verify user owns the task/goal
      const task = await tx.task.findFirst({
        where: { id: taskId, userId: userId },
      });
      if (!task) {
        throw new Error('Task not found or you do not have permission');
      }

      // A) Create or find tags and get their IDs
      let tagIds: { id: string }[] = [];
      if (tags && tags.length > 0) {
        // Use Promise.all to run tag upserts concurrently for better performance
        const upsertedTags = await Promise.all(
          tags.map((tagName) =>
            tx.tag.upsert({
              where: { userId_name: { userId, name: tagName } },
              update: {},
              create: { name: tagName, userId },
              select: { id: true },
            })
          )
        );
        tagIds = upsertedTags;
      }

      // B) Create the focus session
      const createdSession = await tx.focusSession.create({
        data: {
          ...sessionData,
          userId,
          taskId,
          goalId,
          tags: {
            create: tagIds.map((tag) => ({
              tag: { connect: { id: tag.id } },
            })),
          },
        },
      });
      console.log('createdSession:', createdSession);

      // C) Update the task's status if it's currently PENDING
      if (task.status === TaskStatus.PENDING) {
        await tx.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.IN_PROGRESS },
        });
      }
      return [createdSession];
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error: any) {
    console.error('[API:CREATE_FOCUS_SESSION]', error);
    if (error.message.includes('Task not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
