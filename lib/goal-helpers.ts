import { type Goal } from '@prisma/client';

export type GoalWithChildren = Goal & { children: GoalWithChildren[] };

/**
 * Takes a flat array of goals from Prisma and builds a hierarchical tree.
 * @param goals - A flat array of all goals for a user.
 * @returns An array of top-level goals, each with a 'children' array of its sub-goals.
 */
export function buildGoalTree(goals: Goal[]): GoalWithChildren[] {
  const goalMap = new Map<string, GoalWithChildren>();
  const rootGoals: GoalWithChildren[] = [];

  // First pass: create a map of all goals and add a 'children' array.
  goals.forEach((goal) => {
    goalMap.set(goal.id, { ...goal, children: [] });
  });

  // Second pass: link children to their parents.
  goals.forEach((goal) => {
    if (goal.parentId && goalMap.has(goal.parentId)) {
      // This is a sub-goal. Find its parent in the map and push this goal to the parent's children array.
      const parent = goalMap.get(goal.parentId)!;
      parent.children.push(goalMap.get(goal.id)!);
    } else {
      // This is a top-level goal.
      rootGoals.push(goalMap.get(goal.id)!);
    }
  });

  return rootGoals;
}
