import React from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import AdminLayoutShell from "@/layout/AdminLayoutShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  return <AdminLayoutShell user={user}>{children}</AdminLayoutShell>;
}
