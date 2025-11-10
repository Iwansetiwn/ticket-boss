import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  destroySession,
} from "@/lib/auth"

export async function POST() {
  // In Next.js 15+, cookies() returns a Promise
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    await destroySession(token)
  }

  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}
