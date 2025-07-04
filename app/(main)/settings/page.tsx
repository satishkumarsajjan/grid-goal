'use client'; // This page now handles client-side data fetching for its settings sections

import { VacationModeSection } from '@/components/settings/vacation-mode-section';

export default function SettingsPage() {
  return (
    <div>
      <h1 className='text-3xl font-bold mb-6'>Settings</h1>
      <div className='space-y-8'>
        {/* Other settings sections can go here */}

        <VacationModeSection />

        {/* ... */}
      </div>
    </div>
  );
}
