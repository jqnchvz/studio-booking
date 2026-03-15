'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    question: '¿Necesito conocimientos técnicos para usar Reservapp?',
    answer:
      'No. Reservapp está diseñado para que cualquier dueño de negocio pueda configurarlo sin ayuda técnica. Solo necesitas agregar tus recursos, definir tus planes y conectar tu cuenta de MercadoPago. El proceso toma menos de 30 minutos.',
  },
  {
    question: '¿Cómo se procesan los pagos de mis clientes?',
    answer:
      'Los pagos se procesan a través de tu propia cuenta de MercadoPago Chile. El dinero va directo a tu cuenta sin intermediarios. Solo necesitas ingresar tus credenciales de MercadoPago en tu panel de configuración.',
  },
  {
    question: '¿Puedo personalizar los planes que ofrezco a mis clientes?',
    answer:
      'Sí. Puedes crear todos los planes que necesites con el precio, nombre y características que definas. Además puedes configurar qué recursos incluye cada plan y cuántas horas mensuales permite.',
  },
  {
    question: '¿Qué pasa si un cliente no paga a tiempo?',
    answer:
      'El sistema aplica automáticamente un período de gracia y envía recordatorios por email. Si el cliente sigue sin pagar, su acceso se suspende automáticamente. Tú ves todo desde tu panel sin tener que intervenir manualmente.',
  },
  {
    question: '¿Puedo cancelar mi suscripción a Reservapp en cualquier momento?',
    answer:
      'Sí. No hay contratos de permanencia ni penalidades por cancelar. Puedes cancelar tu suscripción en cualquier momento desde tu panel de control y seguirás teniendo acceso hasta el final del período pagado.',
  },
  {
    question: '¿Reservapp funciona en dispositivos móviles?',
    answer:
      'Sí, tanto el panel de administración como la plataforma de reservas para tus clientes están optimizados para móviles, tablets y escritorio.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        aria-expanded={open}
      >
        <span className="font-medium text-sm sm:text-base">{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Preguntas frecuentes</h2>
        </div>

        <div className="rounded-xl border border-border bg-card px-6">
          {FAQS.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
