import { PomodoroCycle, TimerMode } from '@prisma/client';

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

  // Calculate the progress percentage
  // For Pomodoro (countdown), progress increases from 0 to 100 as time passes.
  // For Stopwatch, it's effectively always 0 as there's no defined end.
  const progress =
    mode === 'POMODORO' && intervalDurationMs !== Infinity
      ? Math.min(displayMs / intervalDurationMs, 1)
      : 0;

  // The radius of the circle.
  const radius = 160;
  // The circumference of the circle.
  const circumference = 2 * Math.PI * radius;
  // The length of the stroke dash to show progress.
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className='relative w-96 h-96 flex flex-col items-center justify-center'>
      {/* SVG Container for the progress circle */}
      <svg className='absolute inset-0 w-full h-full' viewBox='0 0 360 360'>
        {/* Background Circle */}
        <circle
          cx='180'
          cy='180'
          r={radius}
          strokeWidth='8'
          className='stroke-muted/20'
          fill='transparent'
        />
        {/* Progress Circle */}
        <circle
          cx='180'
          cy='180'
          r={radius}
          strokeWidth='12'
          className='stroke-primary'
          fill='transparent'
          strokeLinecap='round'
          transform='rotate(-90 180 180)'
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 0.3s linear',
          }}
        />
      </svg>

      {/* Timer Text (positioned in the center) */}
      <div className='z-10 text-center'>
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
    </div>
  );
}
