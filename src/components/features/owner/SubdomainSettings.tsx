'use client';

import { useState, useEffect } from 'react';
import { Globe, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SubdomainSettings() {
  const [currentSlug, setCurrentSlug] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current slug on mount
  useEffect(() => {
    async function fetchSlug() {
      try {
        const res = await fetch('/api/owner/settings/slug');
        if (res.ok) {
          const data = await res.json();
          setCurrentSlug(data.slug);
          setCurrentUrl(data.subdomainUrl);
          setSlug(data.slug);
        }
      } catch {
        // Silently handle — slug section will show empty
      } finally {
        setLoading(false);
      }
    }
    fetchSlug();
  }, []);

  const hasChanges = slug !== currentSlug;
  const isValid = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) && slug.length >= 3;

  async function handleSave() {
    if (!hasChanges || !isValid) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/owner/settings/slug', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentSlug(data.slug);
        setCurrentUrl(data.subdomainUrl);
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al actualizar el subdominio',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando configuración de subdominio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Subdominio</h2>
      </div>

      {/* Current URL */}
      {currentUrl && (
        <div className="text-sm">
          <span className="text-muted-foreground">Tu URL actual: </span>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {currentUrl}
          </a>
        </div>
      )}

      {/* Slug input */}
      <div className="space-y-2">
        <label htmlFor="slug-input" className="text-sm font-medium">
          Subdominio
        </label>
        <Input
          id="slug-input"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
            setMessage(null);
          }}
          placeholder="mi-negocio"
          className="max-w-md"
        />
        {slug && !isValid && (
          <p className="text-xs text-destructive">
            Mín. 3 caracteres. Solo letras minúsculas, números y guiones. No puede empezar ni terminar con guión.
          </p>
        )}
        {slug && isValid && hasChanges && (
          <p className="text-xs text-muted-foreground">
            Tu nueva URL será: <span className="font-medium text-foreground">{slug}.reservapp.com</span>
          </p>
        )}
      </div>

      {/* Warning */}
      {hasChanges && isValid && (
        <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-3">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning">
            Cambiar tu subdominio hará que la URL anterior deje de funcionar inmediatamente.
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'text-success' : 'text-destructive'
          }`}
        >
          {message.type === 'success' && <Check className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!hasChanges || !isValid || saving}
        className="w-full sm:w-auto"
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Guardar subdominio
      </Button>
    </div>
  );
}
