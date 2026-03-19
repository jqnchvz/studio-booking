import { type Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ForUsersSection } from '@/components/landing/ForUsersSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Reservapp — Reservas y suscripciones para negocios y usuarios',
  description:
    'Para negocios: gestiona recursos, suscripciones y cobros con MercadoPago. Para usuarios: reserva en cualquier negocio con una sola cuenta.',
  openGraph: {
    title: 'Reservapp — Reservas y suscripciones para negocios y usuarios',
    description:
      'Para negocios: gestiona recursos y cobros. Para usuarios: reserva en cualquier negocio con una sola cuenta.',
    type: 'website',
    locale: 'es_CL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reservapp — Reservas y suscripciones para negocios y usuarios',
    description: 'Gestiona tu negocio o reserva como usuario. Todo con MercadoPago.',
  },
};

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <ForUsersSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
