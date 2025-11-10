import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const editableFields = [
  "firstName",
  "lastName",
  "phone",
  "bio",
  "location",
  "facebook",
  "twitter",
  "linkedin",
  "instagram",
  "country",
  "cityState",
  "postalCode",
  "taxId",
  "avatarUrl",
] as const;

type ProfilePayload = Partial<Record<(typeof editableFields)[number], string | null>>;

const normalize = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as ProfilePayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data: Record<string, string | null> = {};

  editableFields.forEach((field) => {
    if (field in payload) {
      data[field] = normalize(payload[field]);
    }
  });

  if ("firstName" in data || "lastName" in data) {
    const firstName = data.firstName ?? user.firstName;
    const lastName = data.lastName ?? user.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    data.name = fullName.length ? fullName : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      bio: updated.bio,
      location: updated.location,
      facebook: updated.facebook,
      twitter: updated.twitter,
      linkedin: updated.linkedin,
      instagram: updated.instagram,
      country: updated.country,
      cityState: updated.cityState,
      postalCode: updated.postalCode,
      taxId: updated.taxId,
      avatarUrl: updated.avatarUrl,
    },
  });
}
