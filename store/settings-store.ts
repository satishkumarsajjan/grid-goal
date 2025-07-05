import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of the user's configurable settings
export interface PomodoroSettings {
  durationWork: number; // in seconds
  durationShortBreak: number; // in seconds
  durationLongBreak: number; // in seconds
  cyclesUntilLongBreak: number;
}

interface SettingsState {
  pomodoro: PomodoroSettings;
  // We can add other settings here in the future, e.g., for sound, notifications
}

interface SettingsActions {
  // Actions to update settings will be added when we build the settings UI
  // updatePomodoroSettings: (newSettings: Partial<PomodoroSettings>) => void;
}

// Default values for a new user
const defaultSettings: SettingsState = {
  pomodoro: {
    durationWork: 25 * 60,
    durationShortBreak: 5 * 60,
    durationLongBreak: 15 * 60,
    cyclesUntilLongBreak: 4,
  },
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,
      // Example of an update action for the future:
      // updatePomodoroSettings: (newSettings) => set(state => ({
      //   pomodoro: { ...state.pomodoro, ...newSettings }
      // })),
    }),
    {
      name: 'gridgoal-user-settings',
    }
  )
);
