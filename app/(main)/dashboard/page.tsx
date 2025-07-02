'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { StartSessionButton } from '@/components/timer/start-session-button';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityGrid } from '@/components/dashboard/activity-grid';

// Define the shape of the data we expect from our API
interface DashboardData {
  streak: { currentStreak: number; todayInStreak: boolean };
  totalFocusToday: number;
  activityByDate: Record<string, number>;
}

// The fetcher for our dashboard stats
const fetchDashboardStats = async (): Promise<DashboardData> => {
  const { data } = await axios.get('/api/dashboard/stats');
  return data;
};

export default function DashboardPage() {
  // Use TanStack Query to fetch all dashboard data
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['dashboardStats'], // Unique key for this data
    queryFn: fetchDashboardStats,
  });

  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50'>
            Dashboard
          </h1>
          <p className='mt-1 text-lg text-gray-600 dark:text-gray-400'>
            Welcome back! Let's get focused.
          </p>
        </div>
        <StartSessionButton />
      </div>

      {/* We pass the fetched data down to the child components */}
      {isLoading && <div>Loading stats...</div>}
      {isError && (
        <div className='text-red-500'>Could not load dashboard data.</div>
      )}
      {data && (
        <>
          <StatsCards
            streakData={data.streak}
            totalFocusToday={data.totalFocusToday}
          />
          <ActivityGrid activityData={data.activityByDate} />
        </>
      )}
    </div>
  );
}
