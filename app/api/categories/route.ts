import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('[API:GET_CATEGORIES]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

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
    const validation = createCategorySchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
      });
    }

    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: validation.data.name, mode: 'insensitive' },
      },
    });
    if (existing) {
      return new NextResponse(
        JSON.stringify({ error: 'A category with this name already exists.' }),
        { status: 409 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        userId,
        name: validation.data.name,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('[API:POST_CATEGORY]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    
    const [_, deletedCategories] = await prisma.$transaction([
 
      prisma.goal.updateMany({
        where: { userId: userId },
        data: { categoryId: null },
      }),
     
      prisma.category.deleteMany({
        where: { userId: userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      deletedCount: deletedCategories.count,
    });
  } catch (error) {
    console.error('[API:DELETE_ALL_CATEGORIES]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
