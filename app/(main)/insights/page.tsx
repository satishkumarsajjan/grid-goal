// This outer component can remain a Server Component.
// We will wrap the main content in a client component.

import { InsightsPageClient } from '@/components/analytics/InsightsPageClient';

export default function InsightsPage() {
  return (
    <div className='container mx-auto py-8 px-4 md:px-6'>
      <header className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Your Insights</h1>
        <p className='text-muted-foreground'>
          Analyze your work habits, find your flow, and build a sustainable
          workflow.
        </p>
      </header>
      <InsightsPageClient />
    </div>
  );
}
