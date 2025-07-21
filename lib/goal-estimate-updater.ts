import { Prisma, PrismaClient } from '@prisma/client';

// This is a helper type for Prisma's transaction client to provide better autocompletion.
type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// FIX 1: Define the precise shape of the object returned by our Prisma query.
// This uses Prisma's built-in GetPayload utility type to do this automatically.
type GoalWithChildrenForEstimate = Prisma.GoalGetPayload<{
  select: {
    parentId: true;
    subGoals: { select: { deepEstimateTotalSeconds: true } };
    tasks: { select: { estimatedTimeSeconds: true } };
  };
}>;

/**
 * Updates the `deepEstimateTotalSeconds` for a given goal and then
 * traverses up the tree to update all its ancestors.
 * This function is designed to be highly efficient and should ALWAYS be called
 * inside a Prisma transaction whenever a task's estimate is created, updated, or deleted.
 *
 * @param goalId - The ID of the goal where the change originated.
 * @param tx - The Prisma transaction client passed from the calling API route.
 */
export async function updateGoalTreeEstimates(
  goalId: string,
  tx: PrismaTransactionClient
) {
  let currentGoalId: string | null = goalId;

  while (currentGoalId) {
    // FIX 2: Explicitly type the result of the findUnique call.
    const goalWithChildren: GoalWithChildrenForEstimate | null =
      await tx.goal.findUnique({
        where: { id: currentGoalId },
        select: {
          parentId: true,
          subGoals: { select: { deepEstimateTotalSeconds: true } },
          tasks: { select: { estimatedTimeSeconds: true } },
        },
      });

    if (!goalWithChildren) break;

    // With the main object now correctly typed, TypeScript can infer the types
    // for the parameters in the .reduce() functions, fixing the other errors.
    const directTasksSum = goalWithChildren.tasks.reduce(
      (sum, task) => sum + (task.estimatedTimeSeconds || 0),
      0
    );

    const subGoalsSum = goalWithChildren.subGoals.reduce(
      (sum, subGoal) => sum + subGoal.deepEstimateTotalSeconds,
      0
    );

    const newDeepEstimate = directTasksSum + subGoalsSum;

    await tx.goal.update({
      where: { id: currentGoalId },
      data: { deepEstimateTotalSeconds: newDeepEstimate },
    });

    currentGoalId = goalWithChildren.parentId;
  }
}
