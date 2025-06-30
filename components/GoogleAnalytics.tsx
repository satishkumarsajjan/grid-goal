'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';
import * as gtag from '@/lib/gtag'; // Import our new helper functions

const GoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // This useEffect is now responsible for sending page views on client-side navigation
  useEffect(() => {
    const url = pathname + searchParams.toString();
    gtag.pageview(url); // Use our safe pageview function
  }, [pathname, searchParams]);

  // We only want to run this in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* The main GA script */}
      <Script
        strategy='afterInteractive'
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_MEASUREMENT_ID}`}
      />
      {/* The inline script to initialize GA and send the first pageview */}
      <Script
        id='google-analytics'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', '${gtag.GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
