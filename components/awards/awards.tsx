import { AwardCard } from '@/components/awards/award-card';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { AwardId } from '@prisma/client';

// This is a Server Component that fetches the user's awards
export default async function Awards() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>Not authorized. Please sign in.</p>;
  }

  const userAwards = await prisma.userAward.findMany({
    where: { userId: session.user.id },
    select: { awardId: true },
  });

  const unlockedAwards = new Set(userAwards.map((a) => a.awardId));

  // Get all possible awards from the Prisma Enum to ensure we display all of them
  const allPossibleAwards = Object.values(AwardId);

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='text-center mb-12'>
        <h1 className='text-3xl font-bold tracking-tight'>Your Awards</h1>
        <p className='text-muted-foreground mt-2 max-w-2xl mx-auto'>
          Achievements you've unlocked on your journey to consistency. Each
          badge represents a milestone in your pursuit of your goals.
        </p>
      </div>
      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4'>
        {allPossibleAwards.map((awardId) => (
          <AwardCard
            key={awardId}
            awardId={awardId}
            isUnlocked={unlockedAwards.has(awardId)}
          />
        ))}
      </div>
    </div>
  );
}
