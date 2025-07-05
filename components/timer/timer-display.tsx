import { PomodoroCycle, TimerMode } from '@/store/timer-store';

const formatDisplayTime = (milliseconds: number) => {
  if (milliseconds < 0) milliseconds = 0;
  const totalSeconds = Math.floor(milliseconds / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface TimerDisplayProps {
  mode: TimerMode;
  pomodoroCycle: PomodoroCycle;
  displayMs: number;
  intervalDurationMs: number;
}

export function TimerDisplay({
  mode,
  pomodoroCycle,
  displayMs,
  intervalDurationMs,
}: TimerDisplayProps) {
  const timeLeftMs = intervalDurationMs - displayMs;

  return (
    <div className='text-center'>
      {mode === 'POMODORO' && (
        <p className='text-2xl font-medium text-muted-foreground capitalize mb-2'>
          {pomodoroCycle.replace('_', ' ').toLowerCase()}
        </p>
      )}
      <h1 className='text-8xl md:text-9xl font-bold font-mono tracking-tighter'>
        {mode === 'POMODORO'
          ? formatDisplayTime(timeLeftMs)
          : formatDisplayTime(displayMs)}
      </h1>
    </div>
  );
}
