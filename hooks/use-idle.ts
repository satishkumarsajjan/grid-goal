'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * A custom hook to detect user inactivity.
 * @param timeout - The amount of time in milliseconds to wait before considering the user idle.
 * @returns A boolean `isIdle` that is true if the user has been inactive for the specified timeout.
 */
export function useIdle(timeout: number): boolean {
  const [isIdle, setIsIdle] = useState(false);

  const handleEvent = useCallback(() => {
    setIsIdle(false);
  }, []);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const handleTimeout = () => {
      setIsIdle(true);
    };

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(handleTimeout, timeout);
    };

    // Events that signal user activity
    const events = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
    ];

    const addEventListeners = () => {
      events.forEach((event) => {
        window.addEventListener(event, handleEvent);
        window.addEventListener(event, resetTimer);
      });
    };

    const removeEventListeners = () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent);
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(idleTimer);
    };

    // Initial setup
    addEventListeners();
    resetTimer();

    // Cleanup on component unmount
    return () => {
      removeEventListeners();
    };
  }, [timeout, handleEvent]);

  return isIdle;
}
