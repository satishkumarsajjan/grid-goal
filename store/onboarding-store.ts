import { create } from 'zustand';

interface OnboardingState {
  isOnboardingActive: boolean;
  startOnboarding: () => void;
  endOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isOnboardingActive: false,
  startOnboarding: () => set({ isOnboardingActive: true }),
  endOnboarding: () => set({ isOnboardingActive: false }),
}));
