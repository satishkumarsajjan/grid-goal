'use client';

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

  const progress =
    mode === 'POMODORO' && intervalDurationMs !== Infinity
      ? Math.min(displayMs / intervalDurationMs, 1)
      : 0;

  const radius = 150;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className='relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center'>
      {mode === 'POMODORO' && (
        <svg
          className='absolute inset-0 w-full h-full'
          viewBox='0 0 320 320'
          aria-hidden='true'
        >
          <circle
            cx='160'
            cy='160'
            r={radius}
            strokeWidth={strokeWidth}
            className='stroke-muted/20'
            fill='transparent'
          />
          <circle
            cx='160'
            cy='160'
            r={radius}
            strokeWidth={strokeWidth}
            className='stroke-primary'
            fill='transparent'
            strokeLinecap='round'
            transform='rotate(-90 160 160)'
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.2s linear',
            }}
          />
        </svg>
      )}

      <div className='relative z-10 text-center'>
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
