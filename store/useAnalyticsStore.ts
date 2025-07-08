import { create } from 'zustand';
import { subDays, startOfDay, endOfDay } from 'date-fns';

type AnalyticsDateRange = {
  startDate: Date;
  endDate: Date;
};

type AnalyticsState = {
  range: AnalyticsDateRange;
  setRange: (newRange: AnalyticsDateRange) => void;
  setPreset: (preset: '7d' | '30d' | '90d') => void;
};

// Default to the last 30 days
const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
const today = endOfDay(new Date());

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  range: {
    startDate: thirtyDaysAgo,
    endDate: today,
  },
  setRange: (newRange) => set({ range: newRange }),
  setPreset: (preset) => {
    const newEndDate = endOfDay(new Date());
    let newStartDate: Date;

    switch (preset) {
      case '7d':
        newStartDate = startOfDay(subDays(newEndDate, 6));
        break;
      case '90d':
        newStartDate = startOfDay(subDays(newEndDate, 89));
        break;
      case '30d':
      default:
        newStartDate = startOfDay(subDays(newEndDate, 29));
        break;
    }

    set({ range: { startDate: newStartDate, endDate: newEndDate } });
  },
}));
