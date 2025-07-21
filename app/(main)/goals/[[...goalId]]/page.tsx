import GoalsLayoutAndPage from '@/components/goals/GoalsLayoutAndPage';

export default async function page({
  params,
}: {
  params: Promise<{ goalId?: string[] }>;
}) {
  const resolvedParams = await params;
  const selectedGoalId = resolvedParams.goalId?.[0] ?? null;
  return <GoalsLayoutAndPage goalId={selectedGoalId as string} />;
}
