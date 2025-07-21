import JoinButton from './join';

export function FinalCTASection() {
  return (
    <section id='join' className='px-8' aria-labelledby='cta-heading'>
      <div
        id='waitlist'
        className='py-32 bg-card/50 backdrop-blur-sm rounded-xl mx-auto px-6 text-center'
      >
        <h2 id='cta-heading' className='text-5xl font-bold tracking-tighter'>
          Want to build your grid?
        </h2>
        <p className='mt-6 text-lg text-muted-foreground max-w-md mx-auto'>
          Start by creating your first goal.
        </p>
        <div className='mt-8'>
          <JoinButton text='Get Started' />
        </div>
      </div>
    </section>
  );
}
