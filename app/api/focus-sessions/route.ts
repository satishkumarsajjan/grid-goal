import { auth } from '@/auth';
import { AwardService } from '@/lib/services/award.service';
import { createFocusSessionSchema } from '@/lib/types';
import { prisma } from '@/prisma';
import { TaskStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

      const createdSession = await tx.focusSession.create({
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
  } catch (error: unknown) {
    console.error('[API:CREATE_FOCUS_SESSION]', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Task not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
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
  } catch (error: unknown) {
    console.error('[API:DELETE_FOCUS_SESSION]', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
