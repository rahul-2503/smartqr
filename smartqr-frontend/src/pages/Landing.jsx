import Hero from '../components/landing/Hero';
import ForConsumers from '../components/landing/ForConsumers';
import ForManufacturers from '../components/landing/ForManufacturers';
import HowItWorks from '../components/landing/HowItWorks';
import Features from '../components/landing/Features';
import CTA from '../components/landing/CTA';
import FAQ from '../components/landing/FAQ';

export default function Landing() {
  return (
    <>
      <Hero />
      <ForConsumers />
      <ForManufacturers />
      <HowItWorks />
      <Features />
      <CTA />
      <FAQ />
    </>
  );
}
