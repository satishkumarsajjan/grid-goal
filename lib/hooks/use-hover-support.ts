'use client';

import { useEffect, useState } from 'react';

/**
 * A custom hook to detect device properties like touch capability and mobile screen size.
 * It safely handles server-side rendering by only running checks on the client.
 *
 * @returns {object} An object containing boolean flags for isMobile and isTouch.
 */
const useDeviceDetect = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTouch: false,
  });

  useEffect(() => {
    // This effect runs only on the client, after the component mounts.
    const checkDevice = () => {
      // Check for touch events or navigator.maxTouchPoints to determine touch capability
      const touchSupported =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Check for a common mobile breakpoint
      const mobileScreen = window.innerWidth < 768;

      setDeviceInfo({
        isMobile: mobileScreen,
        isTouch: touchSupported,
      });
    };

    // Run the check on initial mount
    checkDevice();

    // Optional: Re-run the check on window resize
    window.addEventListener('resize', checkDevice);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount

  return deviceInfo;
};

export default useDeviceDetect;
