import { auth } from '@/auth';
import { AwardService } from '@/lib/services/award.service';
import { prisma } from '@/prisma';
import {
  PomodoroCycle,
  SessionVibe,
  TaskStatus,
  TimerMode,
} from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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
  mode: z.nativeEnum(TimerMode),
  pomodoroCycle: z.nativeEnum(PomodoroCycle).optional(),
  sequenceId: z.string().uuid().optional().nullable(),
  markTaskAsComplete: z.boolean().optional(),
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

    const {
      taskId,
      goalId,
      tags,
      sequenceId,
      markTaskAsComplete,
      ...sessionData
    } = validation.data;

    const [newSession] = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, userId: userId },
      });
      if (!task) {
        throw new Error('Task not found or you do not have permission');
      }

      let tagIds: { id: string }[] = [];
      if (tags && tags.length > 0) {
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

      let createdSession;

      if (sessionData.mode === 'POMODORO' && sequenceId) {
        await tx.focusSession.updateMany({
          where: { sequenceId: sequenceId, userId: userId },
          data: {
            noteAccomplished: sessionData.noteAccomplished,
            noteNextStep: sessionData.noteNextStep,
            vibe: sessionData.vibe,
            artifactUrl: sessionData.artifactUrl,
          },
        });

        const existingSessions = await tx.focusSession.findMany({
          where: { sequenceId: sequenceId, userId: userId },
          select: { id: true },
        });

        if (tagIds.length > 0 && existingSessions.length > 0) {
          const tagConnections = existingSessions.flatMap((s) =>
            tagIds.map((tag) => ({
              focusSessionId: s.id,
              tagId: tag.id,
            }))
          );
          await tx.tagsOnFocusSessions.createMany({
            data: tagConnections,
            skipDuplicates: true,
          });
        }
      }

      createdSession = await tx.focusSession.create({
        data: {
          ...sessionData,
          userId,
          taskId,
          goalId,
          sequenceId,
          tags: {
            create: tagIds.map((tag) => ({
              tag: { connect: { id: tag.id } },
            })),
          },
        },
      });

      let newStatus = task.status;
      if (task.status === TaskStatus.PENDING) {
        newStatus = TaskStatus.IN_PROGRESS;
      }
      if (markTaskAsComplete) {
        newStatus = TaskStatus.COMPLETED;
      }

      if (newStatus !== task.status) {
        await tx.task.update({
          where: { id: taskId },
          data: { status: newStatus },
        });
      }
      return [createdSession];
    });

    try {
      await AwardService.processAwards(userId, 'SESSION_SAVED', newSession);
    } catch (awardError) {
      console.error('Failed to process awards for focus-session:', awardError);
    }

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

const deleteFocusSessionSchema = z.object({
  sequenceId: z.string().uuid(),
});

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = deleteFocusSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { sequenceId } = validation.data;

    const { count } = await prisma.focusSession.deleteMany({
      where: {
        sequenceId: sequenceId,
        userId: userId,
      },
    });

    console.log(`Deleted ${count} sessions for sequenceId: ${sequenceId}`);

    return NextResponse.json({ success: true, deletedCount: count });
  } catch (error: any) {
    console.error('[API:DELETE_FOCUS_SESSION]', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
