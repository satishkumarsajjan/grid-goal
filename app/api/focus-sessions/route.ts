import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { SessionVibe, TaskStatus } from '@prisma/client';

// Zod schema for validation
const createFocusSessionSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
  taskId: z.string().cuid(),
  goalId: z.string().cuid(),
  noteAccomplished: z.string().max(10000).optional(),
  noteNextStep: z.string().max(10000).optional(),
  vibe: z.nativeEnum(SessionVibe).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(), // Assuming tags are passed as an array of names
});

// This function handles POST requests to /api/focus-sessions
export async function POST(request: Request) {
  try {
    // 1. Authenticate & Authorize
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    // 2. Validate request body
    const body = await request.json();
    const validation = createFocusSessionSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }
    const { taskId, goalId, tags, ...sessionData } = validation.data;

    // 3. Security Check: Verify user owns the task/goal they are logging time for.
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: userId },
    });

    if (!task) {
      return new NextResponse(
        JSON.stringify({
          error: 'Task not found or you do not have permission',
        }),
        { status: 404 }
      );
    }

    // 4. Perform the database operations within a transaction
    // This ensures that BOTH the session creation and the task update succeed or fail together.
    const [newSession] = await prisma.$transaction(async (tx) => {
      // A) Create or find tags and get their IDs
      let tagIds: { id: string }[] = [];
      if (tags && tags.length > 0) {
        await Promise.all(
          tags.map(async (tagName) => {
            const tag = await tx.tag.upsert({
              where: { userId_name: { userId, name: tagName } },
              update: {},
              create: { name: tagName, userId },
            });
            tagIds.push({ id: tag.id });
          })
        );
      }

      // B) Create the focus session
      const createdSession = await tx.focusSession.create({
        data: {
          ...sessionData,
          userId,
          taskId,
          goalId,
          tags: {
            // Connect the tags to this session
            create: tagIds.map((tag) => ({
              tag: { connect: { id: tag.id } },
            })),
          },
        },
      });

      // C) CRITICAL SIDE-EFFECT: Update the task's status if it's currently PENDING
      if (task.status === TaskStatus.PENDING) {
        await tx.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.IN_PROGRESS },
        });
      }
      return [createdSession];
    });

    // 5. Return a successful response
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('[API:CREATE_FOCUS_SESSION]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
