import { AwardsPage } from '@/components/awards/awards';
import { CategoryManagementSection } from '@/components/settings/CategoryManagementSection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import { VacationModeSection } from '@/components/settings/vacation-mode-section';

export default function SettingsPage() {
  return (
    <div className='pb-8'>
      <h1 className='text-3xl font-bold mb-6'>Settings</h1>
      <div className='flex flex-col gap-8'>
        <div className='grid grid-cols-2 gap-4'>
          <CategoryManagementSection />
          <VacationModeSection />
        </div>
        <AwardsPage />
        <DangerZoneSection />
      </div>
    </div>
  );
}
