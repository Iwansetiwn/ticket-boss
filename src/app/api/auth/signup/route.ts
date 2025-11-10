import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { attachSessionCookie, createSession } from "@/lib/auth";

type SignupPayload = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignupPayload;
  const email = body.email?.toLowerCase().trim();
  const password = body.password?.trim();
  const firstName = body.firstName?.trim() || null;
  const lastName = body.lastName?.trim() || null;
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || null;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      firstName,
      lastName,
    },
  });

  const session = await createSession(user.id);
  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      facebook: user.facebook,
      twitter: user.twitter,
      linkedin: user.linkedin,
      instagram: user.instagram,
      country: user.country,
      cityState: user.cityState,
      postalCode: user.postalCode,
      taxId: user.taxId,
      avatarUrl: user.avatarUrl,
    },
  });

  attachSessionCookie(response, session.token, session.expiresAt);
  return response;
}
