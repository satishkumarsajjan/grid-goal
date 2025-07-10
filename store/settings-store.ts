import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PomodoroSettings {
  durationWork: number; // in seconds
  durationShortBreak: number; // in seconds
  durationLongBreak: number; // in seconds
  cyclesUntilLongBreak: number;
}

// NEW: Define shape for notification settings
export interface NotificationSettings {
  soundEnabled: boolean;
  soundVolume: number; // A value between 0 and 1
}

interface SettingsState {
  pomodoro: PomodoroSettings;
  // NEW: Add notifications to the state
  notifications: NotificationSettings;
}

interface SettingsActions {
  updatePomodoroSettings: (newSettings: Partial<PomodoroSettings>) => void;
  // NEW: Add action to update notification settings
  updateNotificationSettings: (
    newSettings: Partial<NotificationSettings>
  ) => void;
}

const defaultSettings: SettingsState = {
  pomodoro: {
    durationWork: 1 * 60, // 25 minutes
    durationShortBreak: 1 * 60, // 5 minutes
    durationLongBreak: 1 * 60, // 15 minutes
    cyclesUntilLongBreak: 2,
  },
  // NEW: Default notification settings
  notifications: {
    soundEnabled: true,
    soundVolume: 0.5,
  },
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updatePomodoroSettings: (newSettings) =>
        set((state) => ({
          pomodoro: { ...state.pomodoro, ...newSettings },
        })),

      // NEW: Implement the action for notification settings
      updateNotificationSettings: (newSettings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...newSettings },
        })),
    }),
    {
      name: 'gridgoal-user-settings-v1',
    }
  )
);
