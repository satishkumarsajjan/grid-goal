import JoinButton from './join';

export function FinalCTASection() {
  return (
    <section
      id='join'
      className='py-32 bg-card/50 backdrop-blur-sm rounded-xl'
      aria-labelledby='cta-heading'
    >
      <div id='waitlist' className='container mx-auto px-6 text-center'>
        <h2 id='cta-heading' className='text-5xl font-bold tracking-tighter'>
          Want to build your grid?
        </h2>
        <p className='mt-6 text-lg text-muted-foreground max-w-md mx-auto'>
          Get notified when we launch. No spam, just a single email when we're
          live.
        </p>
        <div className='mt-8'>
          <JoinButton text='Join the waitlist by completing this quick survey' />
        </div>
      </div>
    </section>
  );
}
