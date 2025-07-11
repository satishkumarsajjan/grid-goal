import { CategoryManagementSection } from '@/components/settings/CategoryManagementSection';
import { VacationModeSection } from '@/components/settings/vacation-mode-section';

export default function SettingsPage() {
  return (
    <div>
      <h1 className='text-3xl font-bold mb-6'>Settings</h1>
      <div className=' grid grid-cols-2 gap-4'>
        <CategoryManagementSection />
        <VacationModeSection />
      </div>
    </div>
  );
}
