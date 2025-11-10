import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { attachSessionCookie, createSession } from "@/lib/auth";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = body.email?.toLowerCase().trim();
  const password = body.password?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

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
