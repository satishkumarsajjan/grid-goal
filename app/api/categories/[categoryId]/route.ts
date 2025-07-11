import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { categoryId } = params;

    // Security check: Ensure the category belongs to the user trying to delete it
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

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error('[API:DELETE_CATEGORY]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
