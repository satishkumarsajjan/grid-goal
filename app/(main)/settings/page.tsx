'use client';

import { CategoryManagementSection } from '@/components/settings/CategoryManagementSection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import { VacationModeSection } from '@/components/settings/vacation-mode-section';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useState } from 'react';

const TABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'vacation', label: 'Vacation Mode' },
  { id: 'danger', label: 'Danger Zone' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('categories');

  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return <CategoryManagementSection />;
      case 'vacation':
        return <VacationModeSection />;
      case 'danger':
        return <DangerZoneSection />;
      default:
        return null;
    }
  };

  return (
    <div className='pb-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
        <p className='text-muted-foreground mt-1'>
          Manage your account and application preferences.
        </p>
      </div>

      <div className='flex flex-col md:flex-row gap-8 lg:gap-12'>
        <aside className='md:w-1/4 lg:w-1/5'>
          <div className='md:hidden'>
            <ScrollArea className='whitespace-nowrap rounded-md pb-2'>
              <div className='flex w-max space-x-2'>
                {TABS.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>
          </div>

          <nav className='hidden md:flex flex-col space-y-1'>
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                className='w-full justify-start'
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </nav>
        </aside>

        <main className='flex-1'>{renderContent()}</main>
      </div>
    </div>
  );
}
