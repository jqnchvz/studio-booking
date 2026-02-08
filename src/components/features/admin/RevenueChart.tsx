'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCLP } from '@/lib/utils/format';
import type { RevenueData } from '@/types/admin';

interface RevenueChartProps {
  /** Revenue data by month (up to 12 months) */
  data: RevenueData[];
}

/**
 * RevenueChart Component
 *
 * Displays monthly revenue as a line chart using recharts.
 * Shows last 12 months of approved payment revenue.
 *
 * Features:
 * - Smooth monotone curve for visual appeal
 * - Responsive container (adjusts to screen width)
 * - Custom tooltip with Spanish labels and CLP formatting
 * - Y-axis shows abbreviated currency ($12k style)
 * - X-axis shows Spanish month names (Ene, Feb, etc.)
 * - Theme-aware colors using CSS variables
 *
 * Note: MUST be client component (recharts requires browser DOM)
 */
export function RevenueChart({ data }: RevenueChartProps) {
  // Sort data chronologically (oldest first for left-to-right chart)
  const sortedData = [...data].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos Mensuales</CardTitle>
        <CardDescription>
          Últimos 12 meses • Total de pagos aprobados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-sm text-muted-foreground">
            No hay datos de ingresos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={sortedData}>
              {/* Background grid */}
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

              {/* X-axis: Month labels */}
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />

              {/* Y-axis: Revenue with abbreviated format */}
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value: number) =>
                  `$${(value / 1000).toFixed(0)}k`
                }
              />

              {/* Custom tooltip with Spanish labels */}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const data = payload[0].payload as RevenueData;

                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3">
                      <p className="font-semibold">{data.month}</p>
                      <p className="text-sm text-muted-foreground">
                        Ingresos:{' '}
                        <span className="font-medium text-foreground">
                          {formatCLP(data.revenue)}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pagos:{' '}
                        <span className="font-medium text-foreground">
                          {data.payments}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />

              {/* Line graph */}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
