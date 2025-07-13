import { prisma } from '@/prisma';
import { AwardId, FocusSession, Goal } from '@prisma/client';
import { calculateStreak } from '../streak-helpers';
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

const grantAward = async (
  userId: string,
  awardId: AwardId,
  awardedAwards: Set<AwardId>
) => {
  if (awardedAwards.has(awardId)) return;
  await prisma.userAward.create({ data: { userId, awardId } });
  console.log(`Awarded ${awardId} to user ${userId}`);
};

const checkSessionAwards = async (
  userId: string,
  newSession: FocusSession,
  awardedAwards: Set<AwardId>
) => {
  if (!awardedAwards.has(AwardId.FIRST_STEP)) {
    const count = await prisma.focusSession.count({ where: { userId } });
    if (count === 1)
      await grantAward(userId, AwardId.FIRST_STEP, awardedAwards);
  }
  if (
    !awardedAwards.has(AwardId.PERFECT_HANDOFF) &&
    newSession.noteNextStep?.trim()
  ) {
    await grantAward(userId, AwardId.PERFECT_HANDOFF, awardedAwards);
  }
  if (!awardedAwards.has(AwardId.GRIT) && newSession.vibe === 'STRUGGLE') {
    await grantAward(userId, AwardId.GRIT, awardedAwards);
  }
  if (
    !awardedAwards.has(AwardId.DEEP_DIVE) &&
    newSession.durationSeconds >= 7200
  ) {
    await grantAward(userId, AwardId.DEEP_DIVE, awardedAwards);
  }

  const allUserSessions = await prisma.focusSession.findMany({
    where: { userId },
    select: { startTime: true, durationSeconds: true },
    orderBy: { startTime: 'asc' },
  });

  if (!awardedAwards.has(AwardId.MARATHONER)) {
    const totalSecondsToday = allUserSessions
      .filter(
        (s) =>
          s.startTime >= startOfDay(newSession.startTime) &&
          s.startTime <= endOfDay(newSession.startTime)
      )
      .reduce((sum, s) => sum + s.durationSeconds, 0);
    if (totalSecondsToday >= 14400)
      await grantAward(userId, AwardId.MARATHONER, awardedAwards);
  }
  if (!awardedAwards.has(AwardId.CENTURION) && allUserSessions.length >= 100)
    await grantAward(userId, AwardId.CENTURION, awardedAwards);
  if (!awardedAwards.has(AwardId.JOURNEYMAN)) {
    if (allUserSessions.reduce((sum, s) => sum + s.durationSeconds, 0) >= 90000)
      await grantAward(userId, AwardId.JOURNEYMAN, awardedAwards);
  }
  if (!awardedAwards.has(AwardId.THE_COMEBACK) && allUserSessions.length >= 2) {
    if (
      newSession.startTime.getTime() -
        allUserSessions[allUserSessions.length - 2].startTime.getTime() >=
      7 * 24 * 60 * 60 * 1000
    )
      await grantAward(userId, AwardId.THE_COMEBACK, awardedAwards);
  }
  if (!awardedAwards.has(AwardId.WEEKEND_WARRIOR)) {
    const weekStart = startOfWeek(newSession.startTime);
    const weekEnd = endOfWeek(newSession.startTime);
    const weekSessions = allUserSessions.filter(
      (s) => s.startTime >= weekStart && s.startTime <= weekEnd
    );
    if (
      weekSessions.some((s) => s.startTime.getDay() === 6) &&
      weekSessions.some((s) => s.startTime.getDay() === 0)
    )
      await grantAward(userId, AwardId.WEEKEND_WARRIOR, awardedAwards);
  }

  const pausePeriods = await prisma.pausePeriod.findMany({ where: { userId } });
  const streakData = calculateStreak(allUserSessions, pausePeriods);
  if (!awardedAwards.has(AwardId.KINDLING) && streakData.currentStreak >= 3)
    await grantAward(userId, AwardId.KINDLING, awardedAwards);
  if (!awardedAwards.has(AwardId.PERFECT_WEEK) && streakData.currentStreak >= 7)
    await grantAward(userId, AwardId.PERFECT_WEEK, awardedAwards);
  if (!awardedAwards.has(AwardId.IRON_WILL) && streakData.currentStreak >= 30)
    await grantAward(userId, AwardId.IRON_WILL, awardedAwards);
};

const checkGoalAwards = async (
  userId: string,
  goal: Goal,
  awardedAwards: Set<AwardId>
) => {
  if (!awardedAwards.has(AwardId.THE_ARCHITECT)) {
    const count = await prisma.goal.count({ where: { userId } });
    if (count === 1)
      await grantAward(userId, AwardId.THE_ARCHITECT, awardedAwards);
  }
  if (!awardedAwards.has(AwardId.MASTER_PLANNER)) {
    const depthQuery = await prisma.$queryRaw<
      [{ depth: bigint }]
    >`WITH RECURSIVE "GoalDepth" AS (SELECT id, "parentId", 1 as depth FROM "Goal" WHERE id = ${goal.id} UNION ALL SELECT p.id, p."parentId", d.depth + 1 FROM "Goal" p INNER JOIN "GoalDepth" d ON p.id = d."parentId") SELECT MAX(depth) as depth FROM "GoalDepth";`;
    if (Number(depthQuery[0]?.depth || 1) >= 3)
      await grantAward(userId, AwardId.MASTER_PLANNER, awardedAwards);
  }
  if (goal.status === 'ARCHIVED') {
    if (
      !awardedAwards.has(AwardId.AHEAD_OF_THE_CURVE) &&
      goal.deadline &&
      goal.deadline > new Date()
    )
      await grantAward(userId, AwardId.AHEAD_OF_THE_CURVE, awardedAwards);
    const archivedCount = await prisma.goal.count({
      where: { userId, status: 'ARCHIVED' },
    });
    if (!awardedAwards.has(AwardId.THE_FINISHER) && archivedCount === 1)
      await grantAward(userId, AwardId.THE_FINISHER, awardedAwards);
    if (!awardedAwards.has(AwardId.SERIAL_ACHIEVER) && archivedCount >= 10)
      await grantAward(userId, AwardId.SERIAL_ACHIEVER, awardedAwards);
  }
};

const checkTaskAwards = async (userId: string, awardedAwards: Set<AwardId>) => {
  if (!awardedAwards.has(AwardId.IGNITION)) {
    const count = await prisma.task.count({ where: { userId } });
    if (count === 1) await grantAward(userId, AwardId.IGNITION, awardedAwards);
  }
};

const checkUserActionAwards = async (
  userId: string,
  action: 'RESET' | 'PAUSE',
  awardedAwards: Set<AwardId>
) => {
  if (action === 'RESET' && !awardedAwards.has(AwardId.THE_ANALYST)) {
    await grantAward(userId, AwardId.THE_ANALYST, awardedAwards);
  }
  if (action === 'PAUSE' && !awardedAwards.has(AwardId.STRATEGIC_REST)) {
    const count = await prisma.pausePeriod.count({ where: { userId } });
    if (count === 1)
      await grantAward(userId, AwardId.STRATEGIC_REST, awardedAwards);
  }
};

const processAwards = async (
  userId: string,
  trigger:
    | 'SESSION_SAVED'
    | 'GOAL_UPDATED'
    | 'GOAL_CREATED'
    | 'TASK_CREATED'
    | 'RESET_COMPLETED'
    | 'PAUSE_CREATED',
  data?: any
) => {
  try {
    const userAwards = await prisma.userAward.findMany({
      where: { userId },
      select: { awardId: true },
    });
    const awardedAwards = new Set(userAwards.map((a) => a.awardId));
    switch (trigger) {
      case 'SESSION_SAVED':
        if (data)
          await checkSessionAwards(userId, data as FocusSession, awardedAwards);
        break;
      case 'GOAL_UPDATED':
        if (data) await checkGoalAwards(userId, data as Goal, awardedAwards);
        break;
      case 'GOAL_CREATED':
        if (data) await checkGoalAwards(userId, data as Goal, awardedAwards);
        break;
      case 'TASK_CREATED':
        await checkTaskAwards(userId, awardedAwards);
        break;
      case 'RESET_COMPLETED':
        await checkUserActionAwards(userId, 'RESET', awardedAwards);
        break;
      case 'PAUSE_CREATED':
        await checkUserActionAwards(userId, 'PAUSE', awardedAwards);
        break;
    }
  } catch (error) {
    console.error('Error processing awards:', error);
  }
};

export const AwardService = { processAwards };
