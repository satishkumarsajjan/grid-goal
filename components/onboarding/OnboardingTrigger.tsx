'use client';

import { useOnboardingStore } from '@/store/onboarding-store';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';

// The shape of the data from our new API endpoint
interface UserStatus {
  hasCompletedOnboarding: boolean;
}

const fetchUserStatus = async (): Promise<UserStatus> => {
  const { data } = await axios.get('/api/user/status');
  return data;
};

export function OnboardingTrigger() {
  const startOnboarding = useOnboardingStore((state) => state.startOnboarding);

  // Fetch the user's onboarding status once on component mount.
  const { data, isSuccess } = useQuery<UserStatus>({
    queryKey: ['userStatus'],
    queryFn: fetchUserStatus,
    // These options make it robust:
    staleTime: Infinity, // The onboarding status only changes once, so never refetch automatically.
    refetchOnWindowFocus: false, // Don't refetch when the user tabs back to the window.
  });

  useEffect(() => {
    // We must wait for the query to be successful before checking the data.
    if (isSuccess && data && !data.hasCompletedOnboarding) {
      startOnboarding();
    }
  }, [isSuccess, data, startOnboarding]);

  // This component renders nothing itself.
  return null;
}
