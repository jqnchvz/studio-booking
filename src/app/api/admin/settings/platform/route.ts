import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

const SINGLETON_ID = 'singleton';

/**
 * GET /api/admin/settings/platform
 *
 * Returns the singleton platform settings record.
 * Uses upsert as a safety fallback if the row doesn't exist.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const settings = await db.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return NextResponse.json(
      { error: 'Error al cargar configuración de plataforma' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/platform
 *
 * Updates the singleton platform settings record.
 * Requires admin authentication.
 *
 * Body: { platformName, supportEmail, orgApprovalMode,
 *         defaultTrialDays, maxOrganizations, maintenanceMode }
 */
export async function PUT(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const body = await request.json();
    const {
      platformName,
      supportEmail,
      orgApprovalMode,
      defaultTrialDays,
      maxOrganizations,
      maintenanceMode,
    } = body;

    // Validation
    if (!platformName || typeof platformName !== 'string' || platformName.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la plataforma es requerido' },
        { status: 400 }
      );
    }

    if (
      !supportEmail ||
      typeof supportEmail !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)
    ) {
      return NextResponse.json(
        { error: 'El correo de soporte debe ser un email válido' },
        { status: 400 }
      );
    }

    if (!['auto', 'manual'].includes(orgApprovalMode)) {
      return NextResponse.json(
        { error: 'El modo de aprobación debe ser "auto" o "manual"' },
        { status: 400 }
      );
    }

    if (typeof defaultTrialDays !== 'number' || !Number.isInteger(defaultTrialDays) || defaultTrialDays < 0) {
      return NextResponse.json(
        { error: 'Los días de prueba deben ser un número entero >= 0' },
        { status: 400 }
      );
    }

    if (typeof maxOrganizations !== 'number' || !Number.isInteger(maxOrganizations) || maxOrganizations < 0) {
      return NextResponse.json(
        { error: 'El límite de empresas debe ser un número entero >= 0' },
        { status: 400 }
      );
    }

    if (typeof maintenanceMode !== 'boolean') {
      return NextResponse.json(
        { error: 'El modo mantenimiento debe ser verdadero o falso' },
        { status: 400 }
      );
    }

    const settings = await db.platformSettings.update({
      where: { id: SINGLETON_ID },
      data: {
        platformName: platformName.trim(),
        supportEmail: supportEmail.trim().toLowerCase(),
        orgApprovalMode,
        defaultTrialDays,
        maxOrganizations,
        maintenanceMode,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración de plataforma' },
      { status: 500 }
    );
  }
}
