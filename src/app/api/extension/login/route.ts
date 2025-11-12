import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

type LoginPayload = {
  email?: string;
  password?: string;
};

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = body.email?.toLowerCase().trim();
  const password = body.password?.trim();

  if (!email || !password) {
    return withCors(
      NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return withCors(NextResponse.json({ error: "Invalid credentials." }, { status: 401 }));
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return withCors(NextResponse.json({ error: "Invalid credentials." }, { status: 401 }));
  }

  const responseBody = {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    },
  };

  return withCors(NextResponse.json(responseBody));
}
