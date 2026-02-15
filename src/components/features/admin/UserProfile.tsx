'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatChileanDate } from '@/lib/utils/format';
import type { UserDetail } from '@/types/admin';

interface UserProfileProps {
  user: Pick<UserDetail, 'email' | 'isAdmin' | 'emailVerified' | 'createdAt'>;
}

/**
 * UserProfile Component
 *
 * Displays user profile information in a card:
 * - Email address
 * - Email verification status
 * - Admin role badge
 * - Registration date
 */
export function UserProfile({ user }: UserProfileProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil del Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>

          {/* Email verified status */}
          <div>
            <p className="text-sm text-muted-foreground">Email Verificado</p>
            <div className="flex items-center gap-2 mt-1">
              {user.emailVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Verificado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">No verificado</span>
                </>
              )}
            </div>
          </div>

          {/* Registration date */}
          <div>
            <p className="text-sm text-muted-foreground">Fecha de Registro</p>
            <p className="font-medium">
              {formatChileanDate(new Date(user.createdAt))}
            </p>
          </div>

          {/* Admin role */}
          <div>
            <p className="text-sm text-muted-foreground">Rol</p>
            <div className="mt-1">
              {user.isAdmin ? (
                <Badge>Administrador</Badge>
              ) : (
                <Badge variant="outline">Usuario Regular</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
