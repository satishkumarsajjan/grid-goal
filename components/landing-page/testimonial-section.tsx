'use client';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import gsap from 'gsap';
export function TestimonialSection() {
  const container = useRef(null);
  useGSAP(
    () => {
      gsap.from(container.current, {
        opacity: 0,
        duration: 1,
        scrollTrigger: { trigger: container.current, start: 'top 70%' },
      });
    },
    { scope: container }
  );
  return (
    <section
      ref={container}
      id='testimonials'
      className='py-32 bg-card/50 backdrop-blur-sm text-secondary-foreground rounded-xl'
      aria-labelledby='testimonial-heading'
    >
      <div className='container mx-auto px-6 text-center'>
        <blockquote className='max-w-4xl mx-auto'>
          <h2 id='testimonial-heading' className='sr-only'>
            Testimonial from Veena
          </h2>
          <p className='text-3xl md:text-4xl font-medium leading-normal'>
            “GridGoal gives you no excuse to skip the work. Seeing the grid fill
            up is the most satisfying feedback loop I&apos;ve ever used.
            It&apos;s that simple and that powerful.”
          </p>
          <footer className='mt-8'>
            <div className='mt-4 text-lg font-semibold'>Veena</div>
            <div className='text-muted-foreground'>
              Indie Developer & Creator
            </div>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
