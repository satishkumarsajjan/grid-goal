'use client';

import { useState, useEffect } from 'react';

// This component uses a simple trick: by changing the key, we force React
// to re-mount the div, which reliably triggers screen readers to announce the new content.
export function AriaLiveRegion({ message }: { message: string }) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prevKey) => prevKey + 1);
  }, [message]);

  if (!message) return null;

  return (
    <div
      key={key}
      className='sr-only' // Visually hidden, but available to screen readers
      role='status'
      aria-live='polite' // Announce changes when the user is idle
      aria-atomic='true' // Announce the entire message
    >
      {message}
    </div>
  );
}
