import LandingPage from '@/components/landing-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GridGoal | All of the Progress, None of the Bloat',
  description:
    'Manage your goals and tasks. Visualize your dedication. GridGoal helps you create goals and track consistency, grid by grid. Stop guessing. Start achieving.',

  openGraph: {
    title: 'GridGoal | All of the Progress, None of the Bloat',
    description:
      'Manage your goals and tasks. Visualize your dedication. GridGoal helps you create goals and track consistency, grid by grid. Stop guessing. Start achieving.',
    images: [
      {
        url: '/gridgoal-hero.png',
        width: 1200,
        height: 630,
        alt: 'GridGoal App Preview on a Grid Background',
      },
    ],

    url: process.env.NEXT_PUBLIC_URL,
    siteName: 'GridGoal',
    type: 'website',
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'GridGoal | A Minimal Goal Tracking Platform',
    description:
      'Manage your goals and tasks. Visualize your dedication. GridGoal helps you create goals and track consistency, grid by grid. Stop guessing. Start achieving.',
    images: [`${process.env.NEXT_PUBLIC_URL}gridgoal-hero.png`],
    creator: '@iamsatish4564',
  },
};

export default function Home() {
  return <LandingPage />;
}
