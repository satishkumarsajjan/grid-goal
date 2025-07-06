import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { createTaskSchema } from '@/lib/zod-schemas'; // Assuming you have this schema

// ===================================================================
// --- NEW: GET Handler to fetch all tasks for the logged-in user ---
// ===================================================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    // Check for the '?includeGoal=true' query parameter
    const { searchParams } = new URL(request.url);
    const includeGoal = searchParams.get('includeGoal') === 'true';

    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        // We only want to fetch tasks that can be worked on.
        status: {
          not: 'COMPLETED',
        },
      },
      orderBy: {
        createdAt: 'desc', // Show the most recently created tasks first
      },
      // Conditionally include the parent goal's title if requested
      include: {
        goal: includeGoal ? { select: { title: true } } : false,
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[API:GET_ALL_TASKS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

// ================================================================
// --- EXISTING: POST Handler to create a new task ---
// ================================================================
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
    // Assuming your schema might be named 'taskSchema' or similar from previous steps
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    // Ensure you are destructuring based on your actual zod schema
    const { title, goalId } = validation.data;

    // Security Check: Verify that the user owns the goal
    const parentGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!parentGoal) {
      return new NextResponse(
        JSON.stringify({
          error: 'Goal not found or you do not have permission',
        }),
        { status: 404 }
      );
    }

    // 3. Perform the database operation
    const lastTask = await prisma.task.findFirst({
      where: { goalId: goalId },
      orderBy: { sortOrder: 'desc' },
    });
    const newSortOrder = (lastTask?.sortOrder ?? -1) + 1;

    const newTask = await prisma.task.create({
      data: {
        userId,
        goalId,
        title,
        sortOrder: newSortOrder,
        // This assumes estimatedTimeSeconds is handled by your zod schema if present
        // estimatedTimeSeconds: validation.data.estimatedTimeSeconds,
      },
    });

    // 4. Return a successful response
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('[API:CREATE_TASK]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
