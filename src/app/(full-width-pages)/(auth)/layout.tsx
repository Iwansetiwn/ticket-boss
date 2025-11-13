import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="pointer-events-none absolute inset-0 opacity-70 blur-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),transparent_45%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.2),transparent_50%)] dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_bottom,_rgba(15,118,110,0.25),transparent_50%)]" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>
      <div className="fixed bottom-6 right-6 hidden sm:block">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}
