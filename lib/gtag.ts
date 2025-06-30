export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type GTagEvent = {
  action: string;
  category: string;
  label: string;
  value: number;
};

export const pageview = (url: string) => {
  if (GA_MEASUREMENT_ID && typeof (window as any).gtag === 'function') {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (GA_MEASUREMENT_ID && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
