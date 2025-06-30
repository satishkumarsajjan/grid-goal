import {
  BrainCircuit,
  CalendarSync,
  Flame,
  Grid3X3,
  Headphones,
  LineChart,
  LucideProps,
  Palmtree,
  PieChart,
  Share2,
  Timer,
  Wind,
  Workflow,
} from 'lucide-react';
import React from 'react';

export function ToolkitSection() {
  const tools: {
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
    >;
    name: string;
    description?: string;
  }[] = [
    { icon: Workflow, name: 'Nested Goals' },
    { icon: BrainCircuit, name: 'AI Roadmaps (Pro)' },
    { icon: LineChart, name: 'Pace Indicators' },
    { icon: CalendarSync, name: 'Calendar Sync' },

    { icon: Timer, name: 'Custom Timers' },
    { icon: Wind, name: 'Zen Mode' },
    { icon: Headphones, name: 'Focus Sounds' },
    { icon: Palmtree, name: 'Vacation Mode' },

    { icon: Flame, name: 'Streak Tracking' },
    { icon: Grid3X3, name: 'Filtered Grids' },
    { icon: PieChart, name: 'Time Analytics' },
    { icon: Share2, name: 'Shareable Progress' },
  ];

  return (
    <section
      className='py-24 md:py-32 text-center rounded-xl'
      aria-labelledby='toolkit-heading'
    >
      <div className='container mx-auto px-6'>
        <h2
          id='toolkit-heading'
          className='text-4xl font-bold tracking-tighter'
        >
          A powerful toolkit for progress.
        </h2>
        <p className='mt-4 text-lg text-muted-foreground max-w-xl mx-auto'>
          Everything you need to plan, focus, and reflect, without the clutter.
        </p>

        <div className='mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10'>
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.name}
                className='flex flex-col items-center gap-3 group'
              >
                <div className='flex items-center justify-center w-14 h-14 bg-muted rounded-lg text-muted-foreground border border-transparent group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/10'>
                  <Icon size={28} aria-hidden='true' strokeWidth={1.5} />
                </div>
                <span className='font-medium text-foreground text-sm sm:text-base'>
                  {tool.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
