import { type Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Reservapp — Plataforma de reservas y suscripciones para tu negocio',
  description:
    'Gestiona reservas, suscripciones y cobros de tus clientes en un solo lugar. Integración con MercadoPago incluida. Sin configuraciones técnicas.',
  openGraph: {
    title: 'Reservapp — Plataforma de reservas para tu negocio',
    description:
      'Gestiona reservas, suscripciones y cobros de tus clientes en un solo lugar. Integración con MercadoPago incluida.',
    type: 'website',
    locale: 'es_CL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reservapp — Plataforma de reservas para tu negocio',
    description: 'Gestiona reservas, suscripciones y cobros con MercadoPago en un solo lugar.',
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
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
