import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

const ProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  businessType: z.enum(['studio', 'gym', 'clinic', 'other']).nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  timezone: z.string().optional(),
});

/**
 * GET /api/owner/settings/profile
 *
 * Returns the organization name + OrganizationSettings fields
 * used by the profile form.
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        settings: {
          select: {
            businessType: true,
            phone: true,
            address: true,
            timezone: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: org.name,
      businessType: org.settings?.businessType ?? null,
      phone: org.settings?.phone ?? null,
      address: org.settings?.address ?? null,
      timezone: org.settings?.timezone ?? 'America/Santiago',
    });
  } catch (error) {
    console.error('Error fetching owner profile:', error);
    return NextResponse.json({ error: 'Error al cargar el perfil' }, { status: 500 });
  }
}

/**
 * PATCH /api/owner/settings/profile
 *
 * Updates organization name and/or OrganizationSettings business info.
 * Uses upsert for settings — safe whether or not the row exists yet.
 */
export async function PATCH(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const body = await request.json();
    const result = ProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, businessType, phone, address, timezone } = result.data;

    await db.$transaction(async (tx) => {
      if (name !== undefined) {
        await tx.organization.update({
          where: { id: organizationId },
          data: { name },
        });
      }

      await tx.organizationSettings.upsert({
        where: { organizationId },
        update: {
          ...(businessType !== undefined && { businessType }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(timezone !== undefined && { timezone }),
        },
        create: {
          organizationId,
          businessType: businessType ?? null,
          phone: phone ?? null,
          address: address ?? null,
          timezone: timezone ?? 'America/Santiago',
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating owner profile:', error);
    return NextResponse.json({ error: 'Error al guardar la configuración' }, { status: 500 });
  }
}
