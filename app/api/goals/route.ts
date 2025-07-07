// app/api/goals/route.ts

import { auth } from '@/auth';
import { GOAL_COLORS } from '@/lib/constants';
import { createGoalSchema } from '@/lib/zod-schemas';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// This Zod schema now includes the optional 'color' field.

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const goals = await prisma.goal.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('[API:GET_GOALS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = createGoalSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const {
      title,
      description,
      parentId,
      deadline,
      estimatedTimeSeconds,
      color,
    } = validation.data;

    let finalColor = color; // Start with the user's provided color, if any.

    // Smart Color Assignment Logic
    if (!finalColor) {
      // 1. Get all colors currently used by this user's active goals
      const existingGoals = await prisma.goal.findMany({
        where: { userId: userId, status: 'ACTIVE' },
        select: { color: true },
      });
      const usedColors = existingGoals
        .map((goal) => goal.color)
        .filter(Boolean) as string[];

      // 2. Create a frequency map to count how many times each palette color is used
      const colorFrequency = new Map<string, number>();
      GOAL_COLORS.forEach((c) => colorFrequency.set(c, 0));
      usedColors.forEach((used) => {
        if (colorFrequency.has(used)) {
          colorFrequency.set(used, colorFrequency.get(used)! + 1);
        }
      });

      // 3. Find the least frequently used color
      let leastUsedColor = GOAL_COLORS[0];
      let minFrequency = Infinity;

      for (const [paletteColor, frequency] of colorFrequency.entries()) {
        if (frequency === 0) {
          leastUsedColor = paletteColor;
          break; // Found a completely unused color, this is perfect.
        }
        if (frequency < minFrequency) {
          minFrequency = frequency;
          leastUsedColor = paletteColor;
        }
      }
      finalColor = leastUsedColor;
    }

    if (parentId) {
      const parentGoal = await prisma.goal.findFirst({
        where: { id: parentId, userId: userId },
      });
      if (!parentGoal) {
        return new NextResponse(
          JSON.stringify({ error: 'Parent goal not found or access denied.' }),
          { status: 404 }
        );
      }
    }

    const newGoal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        parentId,
        deadline,
        estimatedTimeSeconds,
        color: finalColor, // Use the determined color
      },
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error('[API:CREATE_GOAL]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
