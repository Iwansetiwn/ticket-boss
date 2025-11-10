import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { randomBytes } from "crypto";

import prisma from "./prisma";

export const SESSION_COOKIE_NAME = "session-token";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  country: string | null;
  cityState: string | null;
  postalCode: string | null;
  taxId: string | null;
  avatarUrl: string | null;
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function destroySession(token?: string | null) {
  if (!token) return;
  await prisma.session.deleteMany({
    where: { token },
  });
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  const user = session.user;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    phone: user.phone ?? null,
    bio: user.bio ?? null,
    location: user.location ?? null,
    facebook: user.facebook ?? null,
    twitter: user.twitter ?? null,
    linkedin: user.linkedin ?? null,
    instagram: user.instagram ?? null,
    country: user.country ?? null,
    cityState: user.cityState ?? null,
    postalCode: user.postalCode ?? null,
    taxId: user.taxId ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
});

export function attachSessionCookie(
  res: NextResponse,
  token: string,
  expiresAt: Date
) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}
