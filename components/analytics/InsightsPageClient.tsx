'use client';

import { AnalyticsDateRangePicker } from '@/components/analytics/AnalyticsDateRangePicker';
import { EstimationAccuracyReport } from './EstimationAccuracyReport';
import { FlowTriggersChart } from './FlowTriggersChart';
import { ProductivityHotspotChart } from './ProductivityHotspotChart';
import { SustainabilityReport } from './SustainabilityReport';
import { TimeAllocationChart } from './TimeAllocationChart';
import { SustainabilityReportNeedsImprovement } from './dummy/SustainabilityReport.dummy';

export function InsightsPageClient() {
  return (
    <div className='space-y-6'>
      {/* The global date picker remains at the top for easy access */}
      <div className='flex justify-end'>
        <AnalyticsDateRangePicker />
      </div>

      {/* 
        This is the new "Narrative Flow" layout.
        We use a parent flex container to stack our full-width sections.
      */}
      <div className='flex flex-col gap-6 lg:gap-8'>
        {/* --- SECTION 1: The Overview --- */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8'>
          <TimeAllocationChart />
          <SustainabilityReportNeedsImprovement />
        </div>

        {/* --- SECTION 2: The Deep Dive --- */}
        <div>
          <ProductivityHotspotChart />
        </div>

        {/* --- SECTION 3: The Improvement Plan --- */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8'>
          <FlowTriggersChart />
          <EstimationAccuracyReport />
        </div>
      </div>
    </div>
  );
}
