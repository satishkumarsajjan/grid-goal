import Link from 'next/link';
import { Button } from '../ui/button';

const JoinButton = ({ text }: { text: string }) => {
  return (
    <Link href={'https://forms.gle/P5PgoBdk3XKfQXrB9'} target='_blank'>
      <Button
        className='shadow-primary/20 shadow-[0_4px_15px] hover:cursor-pointer font-bold'
        size={'lg'}
      >
        {text}
      </Button>
    </Link>
  );
};

export default JoinButton;
