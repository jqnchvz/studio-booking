'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  orgApprovalMode: string;
  defaultTrialDays: number;
  maxOrganizations: number;
  maintenanceMode: boolean;
}

interface PlatformSettingsSectionProps {
  initialSettings: PlatformSettings;
}

export function PlatformSettingsSection({ initialSettings }: PlatformSettingsSectionProps) {
  const [platformName, setPlatformName] = useState(initialSettings.platformName);
  const [supportEmail, setSupportEmail] = useState(initialSettings.supportEmail);
  const [orgApprovalMode, setOrgApprovalMode] = useState(initialSettings.orgApprovalMode);
  const [defaultTrialDays, setDefaultTrialDays] = useState(String(initialSettings.defaultTrialDays));
  const [maxOrganizations, setMaxOrganizations] = useState(String(initialSettings.maxOrganizations));
  const [maintenanceMode, setMaintenanceMode] = useState(initialSettings.maintenanceMode);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platformName.trim()) {
      alert('El nombre de la plataforma es requerido');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch('/api/admin/settings/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: platformName.trim(),
          supportEmail: supportEmail.trim(),
          orgApprovalMode,
          defaultTrialDays: Math.max(0, parseInt(defaultTrialDays) || 0),
          maxOrganizations: Math.max(0, parseInt(maxOrganizations) || 0),
          maintenanceMode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar configuración');
      }

      const data = await response.json();
      const saved: PlatformSettings = data.settings;

      // Sync local state with server response
      setPlatformName(saved.platformName);
      setSupportEmail(saved.supportEmail);
      setOrgApprovalMode(saved.orgApprovalMode);
      setDefaultTrialDays(String(saved.defaultTrialDays));
      setMaxOrganizations(String(saved.maxOrganizations));
      setMaintenanceMode(saved.maintenanceMode);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="platform-name">Nombre de la plataforma</Label>
          <Input
            id="platform-name"
            value={platformName}
            onChange={e => setPlatformName(e.target.value)}
            placeholder="Reservapp"
            disabled={saveLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-email">Correo de soporte</Label>
          <Input
            id="support-email"
            type="email"
            value={supportEmail}
            onChange={e => setSupportEmail(e.target.value)}
            placeholder="soporte@reservapp.com"
            disabled={saveLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="approval-mode">Modo de aprobación</Label>
          <select
            id="approval-mode"
            value={orgApprovalMode}
            onChange={e => setOrgApprovalMode(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background h-10"
            disabled={saveLoading}
          >
            <option value="auto">Aprobación automática</option>
            <option value="manual">Aprobación manual</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trial-days">Días de prueba</Label>
          <Input
            id="trial-days"
            type="number"
            min="0"
            step="1"
            value={defaultTrialDays}
            onChange={e => setDefaultTrialDays(e.target.value)}
            placeholder="0"
            disabled={saveLoading}
          />
          <p className="text-xs text-muted-foreground">0 = sin período de prueba</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-orgs">Límite de empresas</Label>
          <Input
            id="max-orgs"
            type="number"
            min="0"
            step="1"
            value={maxOrganizations}
            onChange={e => setMaxOrganizations(e.target.value)}
            placeholder="0"
            disabled={saveLoading}
          />
          <p className="text-xs text-muted-foreground">0 = sin límite</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/5 p-4">
        <input
          type="checkbox"
          id="maintenance-mode"
          checked={maintenanceMode}
          onChange={e => setMaintenanceMode(e.target.checked)}
          disabled={saveLoading}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <div>
          <Label htmlFor="maintenance-mode" className="cursor-pointer">
            Modo mantenimiento
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Activa una página de mantenimiento para toda la plataforma
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saveLoading}>
          {saveLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  );
}
