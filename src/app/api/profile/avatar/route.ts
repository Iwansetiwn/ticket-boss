import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Avatar file is required." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be 2MB or smaller." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const extension = ALLOWED_MIME_TYPES.get(file.type) ?? "png";
  const fileName = `${user.id}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  if (user.avatarUrl?.startsWith("/uploads/avatars/")) {
    const previousPath = path.join(process.cwd(), "public", user.avatarUrl);
    await unlink(previousPath).catch(() => undefined);
  }

  const publicPath = path.posix.join("/uploads/avatars", fileName);
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: publicPath },
  });

  return NextResponse.json({ ok: true, avatarUrl: publicPath });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avatarUrl = user.avatarUrl;
  if (avatarUrl?.startsWith("/uploads/avatars/")) {
    const filePath = path.join(process.cwd(), "public", avatarUrl);
    await unlink(filePath).catch(() => undefined);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: null },
  });

  return NextResponse.json({ ok: true });
}
