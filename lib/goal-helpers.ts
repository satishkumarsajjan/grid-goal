import {
  type GoalWithProgress,
  type GoalWithProgressAndChildren,
} from '@/lib/types';

export function buildGoalTree(
  goals: GoalWithProgress[]
): GoalWithProgressAndChildren[] {
  // The implementation logic remains exactly the same as before.
  // We are just updating the type signatures.
  const goalMap = new Map<string, GoalWithProgressAndChildren>();
  const rootGoals: GoalWithProgressAndChildren[] = [];

  goals.forEach((goal) => {
    goalMap.set(goal.id, { ...goal, children: [] });
  });

  goals.forEach((goal) => {
    if (goal.parentId && goalMap.has(goal.parentId)) {
      const parent = goalMap.get(goal.parentId)!;
      parent.children.push(goalMap.get(goal.id)!);
    } else {
      rootGoals.push(goalMap.get(goal.id)!);
    }
  });

  return rootGoals;
}
