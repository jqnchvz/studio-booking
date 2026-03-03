'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ProfileEditForm from '@/components/features/profile/ProfileEditForm';
import PasswordChangeForm from '@/components/features/profile/PasswordChangeForm';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
        throw new Error(data.message || 'Error al cargar el perfil');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    setIsEditing(false);
  };

  const openEditForm = () => {
    setIsChangingPassword(false);
    setIsEditing(true);
  };

  const openPasswordForm = () => {
    setIsEditing(false);
    setIsChangingPassword(true);
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
            <Button onClick={fetchProfile} className="mt-4 w-full" variant="outline">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mi Perfil
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Administra la información de tu cuenta
          </p>
        </div>

        {/* Account info */}
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
            {!isEditing && (
              <Button onClick={openEditForm} size="sm">
                Editar Perfil
              </Button>
            )}
          </div>

          {isEditing ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">Editar Perfil</h3>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancelar
                </Button>
              </div>
              <ProfileEditForm currentUser={user} onSuccess={handleProfileUpdated} />
            </>
          ) : (
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
                <dd className="mt-1 text-sm text-foreground">{user.name}</dd>
              </div>

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

              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Tipo de cuenta
                </dt>
                <dd className="mt-1">
                  {user.isAdmin ? (
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Administrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Usuario
                    </span>
                  )}
                </dd>
              </div>

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
          )}
        </div>

        {/* Password change */}
        <div className="rounded-lg bg-card border border-border p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">Seguridad</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Actualiza tu contraseña
              </p>
            </div>
            {!isChangingPassword && (
              <Button onClick={openPasswordForm} variant="outline" size="sm">
                Cambiar contraseña
              </Button>
            )}
          </div>

          {isChangingPassword ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">
                  Cambiar Contraseña
                </h3>
                <Button
                  onClick={() => setIsChangingPassword(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
              <PasswordChangeForm />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Usa una contraseña segura que no uses en otros sitios.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
