'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

// Icon mapping to avoid passing functions from Server to Client Components
const iconMap = {
  users: Users,
  dollarSign: DollarSign,
  trendingUp: TrendingUp,
  calendar: Calendar,
  alertCircle: AlertCircle,
} as const;

type IconName = keyof typeof iconMap;

interface MetricCardProps {
  /** Spanish title (e.g., "Suscripciones Activas") */
  title: string;

  /** Formatted value to display (e.g., "42" or "$1.200.000") */
  value: string | number;

  /** Icon name from available icons */
  icon: IconName;

  /** Optional trend indicator */
  trend?: {
    /** Percentage value (e.g., 12.5 for 12.5%) */
    value: number;
    /** True for positive/green, false for negative/red */
    isPositive: boolean;
    /** Label text (e.g., "vs. mes anterior") */
    label: string;
  };

  /** Optional description/subtitle */
  description?: string;
}

/**
 * MetricCard Component
 *
 * Displays a single metric with an icon, value, and optional trend indicator.
 * Used in the admin dashboard to show key business metrics.
 *
 * Design:
 * - Card-based layout following shadcn/ui patterns
 * - Icon in header for visual identification
 * - Large value display (text-2xl)
 * - Optional trend arrow with percentage
 * - Responsive: no text overflow on mobile
 */
export function MetricCard({
  title,
  value,
  icon,
  trend,
  description,
}: MetricCardProps) {
  const Icon = iconMap[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {trend && (
          <p
            className={`text-xs flex items-center gap-1 mt-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
          </p>
        )}

        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
