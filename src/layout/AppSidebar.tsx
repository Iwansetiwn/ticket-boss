"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  GroupIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <TableIcon />,
    name: "Tickets",
    path: "/dashboard/tickets",
  },
  {
    icon: <PieChartIcon />,
    name: "KPI",
    path: "/kpi",
  },
  {
    icon: <GroupIcon />,
    name: "Today Ticket League",
    path: "/today-league",
  },
  {
    icon: <PlugInIcon />,
    name: "Tools",
    path: "/tools",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-2 py-1 text-lg font-semibold text-gray-900 transition hover:text-brand-500 dark:text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-base font-bold text-white">
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Ticket Boss logo"
              width={24}
              height={24}
              priority
            />
          </span>
          {(isExpanded || isHovered || isMobileOpen) && <span>Ticket Boss</span>}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Main Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              <ul className="flex flex-col gap-4">
                {navItems.map((nav) =>
                  nav.path ? (
                    <li key={nav.name}>
                      <Link
                        href={nav.path}
                        className={`menu-item group ${
                          isActive(nav.path)
                            ? "menu-item-active"
                            : "menu-item-inactive"
                        }`}
                      >
                        <span
                          className={`${
                            isActive(nav.path)
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive"
                          }`}
                        >
                          {nav.icon}
                        </span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className={`menu-item-text`}>{nav.name}</span>
                        )}
                      </Link>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
