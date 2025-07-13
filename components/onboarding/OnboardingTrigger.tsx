'use client';

import { useOnboardingStore } from '@/store/onboarding-store';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';

interface UserStatus {
  hasCompletedOnboarding: boolean;
}

const fetchUserStatus = async (): Promise<UserStatus> => {
  const { data } = await axios.get('/api/user/status');
  return data;
};

export function OnboardingTrigger() {
  const startOnboarding = useOnboardingStore((state) => state.startOnboarding);

  const { data, isSuccess } = useQuery<UserStatus>({
    queryKey: ['userStatus'],
    queryFn: fetchUserStatus,

    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isSuccess && data && !data.hasCompletedOnboarding) {
      startOnboarding();
    }
  }, [isSuccess, data, startOnboarding]);

  return null;
}
