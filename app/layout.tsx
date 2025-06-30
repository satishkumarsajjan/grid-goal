import { GoogleAnalytics } from '@next/third-parties/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL as string),
  icons: {
    icon: '/gridgoal-logo.svg',
  },
  title: {
    default: 'GridGoal',
    template: `%s | GridGoal`,
  },
  description:
    'Manage your goals and tasks. Visualize your dedication. GridGoal helps you create goals and track consistency, grid by grid. Stop guessing. Start achieving.',
  openGraph: {
    title: 'GridGoal',
    description:
      'Manage your goals and tasks. Visualize your dedication. GridGoal helps you create goals and track consistency, grid by grid. Stop guessing. Start achieving.',

    images: ['/gridgoal-hero.png'],
    siteName: 'GridGoal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};
gsap.registerPlugin(ScrollTrigger);
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <Analytics />
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
