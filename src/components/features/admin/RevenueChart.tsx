'use client';

import {
  Bar,
  BarChart,
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
 * Displays monthly revenue as a bar chart using recharts.
 * Shows last 12 months of approved payment revenue.
 *
 * Features:
 * - Bar chart for clear month-by-month comparison
 * - Responsive container (adjusts to screen width)
 * - Custom tooltip with Spanish labels and CLP formatting
 * - Y-axis shows abbreviated currency ($12k style)
 * - X-axis shows Spanish month names (Ene, Feb, etc.)
 * - Theme-aware colors using CSS variables (Tailwind v4 pattern)
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
            <BarChart data={sortedData} barCategoryGap="30%">
              {/* Background grid — horizontal lines only for cleaner look */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
              />

              {/* X-axis: Month labels */}
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              />

              {/* Y-axis: Revenue with abbreviated format */}
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(value: number) =>
                  value === 0 ? '$0' : `$${(value / 1000).toFixed(0)}k`
                }
                width={48}
              />

              {/* Custom tooltip with Spanish labels */}
              <Tooltip
                cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const entry = payload[0].payload as RevenueData;

                  return (
                    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
                      <p className="font-semibold mb-1">{entry.month}</p>
                      <p className="text-muted-foreground">
                        Ingresos:{' '}
                        <span className="font-medium text-foreground">
                          {formatCLP(entry.revenue)}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Pagos:{' '}
                        <span className="font-medium text-foreground">
                          {entry.payments}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />

              {/* Bars with brand amber */}
              <Bar
                dataKey="revenue"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
