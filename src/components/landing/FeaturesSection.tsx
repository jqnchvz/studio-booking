import {
  CalendarDays,
  CreditCard,
  Bell,
  LayoutDashboard,
  Users,
  Building2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Reservas online',
    description:
      'Tus clientes reservan en tiempo real desde cualquier dispositivo, 24/7, sin llamadas ni mensajes.',
  },
  {
    icon: Users,
    title: 'Suscripciones flexibles',
    description:
      'Define planes mensuales con acceso a recursos específicos y límites de horas personalizados.',
  },
  {
    icon: CreditCard,
    title: 'Cobros con MercadoPago',
    description:
      'Los pagos mensuales se procesan automáticamente con tu propia cuenta de MercadoPago Chile.',
  },
  {
    icon: Building2,
    title: 'Gestión de recursos',
    description:
      'Administra salas, canchas, equipos y cualquier espacio con horarios y disponibilidad personalizados.',
  },
  {
    icon: Bell,
    title: 'Notificaciones automáticas',
    description:
      'Recordatorios de pago, confirmaciones de reserva y alertas de vencimiento enviados por email sin configuración.',
  },
  {
    icon: LayoutDashboard,
    title: 'Panel de control',
    description:
      'Visualiza reservas activas, ingresos del mes, suscriptores y pagos en tiempo real desde un solo lugar.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Características</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Todo lo que necesita tu negocio</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sin integraciones complejas. Sin configuraciones técnicas. Todo funciona desde el primer día.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
