'use client';

import { AnalyticsDateRangePicker } from '@/components/analytics/AnalyticsDateRangePicker';
import { EstimationAccuracyReport } from '@/components/analytics/EstimationAccuracyReport';
import { FlowTriggersChart } from '@/components/analytics/FlowTriggersChart';
import { ProductivityHotspotChart } from '@/components/analytics/ProductivityHotspotChart';
import { SustainabilityReport } from '@/components/analytics/SustainabilityReport';
import { TimeAllocationChart } from '@/components/analytics/TimeAllocationChart';
import { EstimationAccuracyReportWithData } from './dummy/EstimationAccuracyReport.dummy';
import { FlowTriggersChartWithData } from './dummy/FlowTriggersChart.dummy';
import { ProductivityHotspotChartWithData } from './dummy/ProductivityHotspotChart.dummy';
import { SustainabilityReportWithData } from './dummy/SustainabilityReport.dummy';
import { TimeAllocationChartWithData } from './dummy/TimeAllocationChart.dummy';

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
          <TimeAllocationChartWithData />
          <SustainabilityReportWithData />
        </div>

        {/* --- SECTION 2: The Deep Dive --- */}
        <div>
          <ProductivityHotspotChartWithData />
        </div>

        {/* --- SECTION 3: The Improvement Plan --- */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8'>
          <FlowTriggersChartWithData />
          <EstimationAccuracyReportWithData />
        </div>
      </div>
    </div>
  );
}
