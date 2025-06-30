import { EnterBlur } from '../ui/enter-blur';
import { TaskActivity } from './activity-feed';
import { AwardsSection } from './awards-section';
import { FeatureBentoGrid } from './feature-bento-grid';
import { FinalCTASection } from './final-cta-Section';
import { Footer } from './footer';
import { Header } from './header';
import { HeroSection } from './hero-section';
import { DualRewindSection } from './rewind-section';
import { TestimonialSection } from './testimonial-section';
import { ToolkitSection } from './toolkit-section';
import { VisualWorkflowSection } from './visual-workflow-section';

const LandingPage = () => {
  return (
    <div className='max-w-6xl mx-auto'>
      <div className='fixed top-0 left-0 w-full h-full -z-10 opacity-0 dark:opacity-30 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]'>
        <div className='absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent'></div>
        <EnterBlur
          delay={1}
          className="absolute inset-0 [--aurora:repeating-linear-gradient(100deg,hsl(142.1_76.2%_36.3%)_0%,hsl(142.1_76.2%_36.3%/0.7)_7%,transparent_10%,transparent_12%,hsl(142.1_76.2%_36.3%)_16%)] [background-image:var(--aurora),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] [filter:blur(10px)_invert(0)] after:content-[''] after:absolute after:inset-0 after:[background-image:var(--aurora),var(--aurora)] after:[background-size:200%,_100%] after:[background-position:50%_50%,50%_50%] after:[filter:blur(15px)_invert(0)] after:[mix-blend-mode:color-dodge] animate-[aurora_10s_linear_infinite]"
        >
          {''}
        </EnterBlur>
      </div>

      <Header />
      <HeroSection />
      <TaskActivity />
      <VisualWorkflowSection />
      <FeatureBentoGrid />
      <AwardsSection />
      <DualRewindSection />
      <TestimonialSection />
      <ToolkitSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
