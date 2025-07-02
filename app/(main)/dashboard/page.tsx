import { StartSessionButton } from '@/components/timer/start-session-button'; // 1. Import the button

export default function DashboardPage() {
  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50'>
            Dashboard
          </h1>
          <p className='mt-1 text-lg text-gray-600 dark:text-gray-400'>
            Welcome back! Let's get focused.
          </p>
        </div>
        {/* 2. Place the button prominently in the header */}
        <StartSessionButton />
      </div>

      {/* 
        This is where we will build The Grid and Stats Cards next.
        For now, it's just a placeholder.
      */}
      <div className='p-8 text-center border-2 border-dashed rounded-lg'>
        <p>Your activity grid will be displayed here.</p>
      </div>
    </div>
  );
}
