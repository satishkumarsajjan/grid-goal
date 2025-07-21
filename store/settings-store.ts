import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PomodoroSettings {
  durationWork: number; // in seconds
  durationShortBreak: number; // in seconds
  durationLongBreak: number; // in seconds
  cyclesUntilLongBreak: number;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  soundVolume: number; // A value between 0 and 1
}

interface SettingsState {
  pomodoro: PomodoroSettings;
  notifications: NotificationSettings;
}

interface SettingsActions {
  updatePomodoroSettings: (newSettings: Partial<PomodoroSettings>) => void;

  updateNotificationSettings: (
    newSettings: Partial<NotificationSettings>
  ) => void;
}

const defaultSettings: SettingsState = {
  pomodoro: {
    durationWork: 25 * 60, // 25 minutes
    durationShortBreak: 5 * 60, // 5 minutes
    durationLongBreak: 30 * 60, // 15 minutes
    cyclesUntilLongBreak: 2,
  },

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
