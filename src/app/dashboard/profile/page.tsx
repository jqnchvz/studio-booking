'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ProfileEditForm from '@/components/features/profile/ProfileEditForm';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Profile Page
 * Displays user information and allows editing
 */
export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-destructive/10 p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={fetchProfile}
              className="mt-4 w-full"
              variant="outline"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mi Perfil
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Administra la información de tu cuenta
          </p>
        </div>

        {isEditing ? (
          <div className="rounded-lg bg-card border border-border p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                Editar Perfil
              </h2>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
            <ProfileEditForm
              currentUser={user}
              onSuccess={handleProfileUpdated}
            />
          </div>
        ) : (
          <div className="rounded-lg bg-card border border-border p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  Información de la Cuenta
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tus datos personales y configuración
                </p>
              </div>
              <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
            </div>

            <dl className="space-y-6">
              {/* Name */}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
                <dd className="mt-1 text-sm text-foreground">{user.name}</dd>
              </div>

              {/* Email */}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-foreground">{user.email}</span>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                      Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                      Sin verificar
                    </span>
                  )}
                </dd>
                {!user.emailVerified && (
                  <p className="mt-1 text-sm text-warning">
                    Revisa tu email para verificar tu cuenta
                  </p>
                )}
              </div>

              {/* Account Type */}
              {user.isAdmin && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Tipo de cuenta
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Administrador
                    </span>
                  </dd>
                </div>
              )}

              {/* Member Since */}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Miembro desde
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Date(user.createdAt).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
