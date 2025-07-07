import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of the user's configurable settings for Pomodoro
export interface PomodoroSettings {
  durationWork: number; // in seconds
  durationShortBreak: number; // in seconds
  durationLongBreak: number; // in seconds
  cyclesUntilLongBreak: number;
}

interface SettingsState {
  pomodoro: PomodoroSettings;
  // In the future, we can add other settings here:
  // notifications: { volume: number; sound: string; };
  // theme: 'light' | 'dark' | 'system';
}

interface SettingsActions {
  // We will implement these actions when we build the user-facing settings page
  // updatePomodoroSettings: (newSettings: Partial<PomodoroSettings>) => void;
}

// Default values for any new user of the application
const defaultSettings: SettingsState = {
  pomodoro: {
    durationWork: 1 * 60, // 25 minutes
    durationShortBreak: 1 * 60, // 5 minutes
    durationLongBreak: 1 * 60, // 15 minutes
    cyclesUntilLongBreak: 2,
  },
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,
      // Example for the future:
      // updatePomodoroSettings: (newSettings) => set(state => ({
      //   pomodoro: { ...state.pomodoro, ...newSettings }
      // })),
    }),
    {
      name: 'gridgoal-user-settings-v1', // Unique name for localStorage
    }
  )
);
