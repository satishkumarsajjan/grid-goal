import Link from 'next/link';
import { Button } from '../ui/button';
import React from 'react';

const JoinButton = ({ text }: { text: string }) => {
  const wrapperStyle: React.CSSProperties = {
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
    background:
      'conic-gradient(from 90deg at 50% 50%, #a3e635 0%, #22c55e 50%, #a3e635 100%)',
  };

  return (
    <Link href={'https://forms.gle/P5PgoBdk3XKfQXrB9'} target='_blank'>
      <div
        className='relative inline-block p-0.5 rounded-lg'
        style={wrapperStyle}
      >
        <Button
          className='w-full font-bold bg-black hover:bg-black/90  text-white rounded-lg'
          size={'lg'}
        >
          {text}
        </Button>
      </div>
    </Link>
  );
};

export default JoinButton;
