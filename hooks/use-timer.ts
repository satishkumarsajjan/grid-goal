'use client';

import { useState, useEffect, useRef } from 'react';
import { useTimerStore } from '@/store/timer-store';

export function useTimer() {
  // Get the start time and active status from the global store
  const { startTime, isActive } = useTimerStore();

  // Local state to hold the continuously updating elapsed time
  const [elapsedTime, setElapsedTime] = useState(0);

  // Use a ref to hold the interval ID so we can clear it properly
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // This effect runs whenever the active status of the timer changes
    if (isActive && startTime) {
      // If the timer is active, set up an interval to run every second
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        // Calculate the difference in seconds from the start time
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      // If the timer is not active, clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function: This will run when the component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startTime]); // Re-run the effect if isActive or startTime changes

  return elapsedTime;
}
