const STEPS = [
  {
    number: '01',
    title: 'Configura tu negocio',
    description:
      'Agrega tus recursos (salas, canchas, equipos), define los planes de suscripción que ofrecerás y conecta tu cuenta de MercadoPago.',
  },
  {
    number: '02',
    title: 'Tus clientes se suscriben',
    description:
      'Comparten el link de tu espacio, eligen un plan y pagan automáticamente cada mes. Sin fricción, sin intermediarios.',
  },
  {
    number: '03',
    title: 'Gestiona todo desde tu panel',
    description:
      'Visualiza reservas en tiempo real, monitorea pagos e ingresos, y administra tus suscriptores desde un solo lugar.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Listo en tres pasos</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sin equipos de soporte. Sin semanas de implementación. Empieza hoy.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />

          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center space-y-4">
              {/* Number badge */}
              <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0 shadow-sm">
                {step.number}
              </div>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
