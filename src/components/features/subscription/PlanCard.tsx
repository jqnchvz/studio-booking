'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCLP } from '@/lib/utils/format';
import { Check } from 'lucide-react';
import { SubscribeButton } from './SubscribeButton';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  interval: string;
  features: string[];
  isActive: boolean;
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  isRecommended?: boolean;
}

export function PlanCard({ plan, isRecommended = false }: PlanCardProps) {
  return (
    <Card className={isRecommended ? 'border-primary shadow-lg' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          {isRecommended && (
            <Badge variant="default">Recomendado</Badge>
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              {formatCLP(plan.price)}
            </span>
            <span className="text-muted-foreground">
              /{plan.interval === 'monthly' ? 'mes' : 'año'}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Incluye:</p>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <SubscribeButton planId={plan.id} planName={plan.name} />
      </CardFooter>
    </Card>
  );
}
