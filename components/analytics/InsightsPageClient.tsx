'use client';

import { AnalyticsDateRangePicker } from '@/components/analytics/AnalyticsDateRangePicker';
import { EstimationAccuracyReport } from './EstimationAccuracyReport';
import { FlowTriggersChart } from './FlowTriggersChart';
import { ProductivityHotspotChart } from './ProductivityHotspotChart';
import { SustainabilityReport } from './SustainabilityReport';
import { TimeAllocationChart } from './TimeAllocationChart';

export function InsightsPageClient() {
  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <AnalyticsDateRangePicker />
      </div>

      <div className='flex flex-col gap-6 lg:gap-8'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8'>
          <TimeAllocationChart />
          <SustainabilityReport />
        </div>

        <div>
          <ProductivityHotspotChart />
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8'>
          <FlowTriggersChart />
          <EstimationAccuracyReport />
        </div>
      </div>
    </div>
  );
}
