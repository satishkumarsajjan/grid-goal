'use client';

import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as React from 'react';

/**
 * A React component that animates children with a blur-to-clear entrance effect.
 * The animation triggers when the element enters the viewport and includes opacity fade-in.
 *
 * @param children - The React elements to animate
 * @param delay - Optional delay before animation starts (default: 0)
 * @param className - Optional CSS classes to apply to the wrapper div
 */
export const EnterBlur = ({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: gsap.TweenValue | undefined;
  className?: string;
}) => {
  const ref = React.useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ref.current,
        {
          filter: 'blur(20px)',
          opacity: 0,
        },
        {
          filter: 'blur(0px)',
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          delay: delay,
          scrollTrigger: {
            trigger: ref.current,
            once: true,
            start: 'top 80%',
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn('opacity-0', className)}>
      {children}
    </div>
  );
};
