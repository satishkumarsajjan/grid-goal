import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { categoryId } = await params;

    const categoryToDelete = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: userId,
      },
    });

    if (!categoryToDelete) {
      return new NextResponse(
        JSON.stringify({ error: 'Category not found or access denied' }),
        { status: 404 }
      );
    }

    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API:DELETE_CATEGORY]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less'),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { categoryId } = await params;

    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
      });
    }
    const { name } = validation.data;

    const categoryToUpdate = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!categoryToUpdate) {
      return new NextResponse(
        JSON.stringify({ error: 'Category not found or access denied' }),
        { status: 404 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: name, mode: 'insensitive' },
        id: { not: categoryId },
      },
    });
    if (existing) {
      return new NextResponse(
        JSON.stringify({
          error: 'Another category with this name already exists.',
        }),
        { status: 409 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('[API:UPDATE_CATEGORY]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
