import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
                <Link
                  href="/"
                  className="mb-4 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 text-2xl font-semibold text-white shadow-lg backdrop-blur"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                    <Image
                      src="/images/logo/logo-icon.svg"
                      alt="Ticket Boss logo"
                      width={28}
                      height={28}
                      priority
                    />
                  </span>
                  <span>Ticket Boss</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
