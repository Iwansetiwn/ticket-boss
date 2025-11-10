"use client";

import React, { useMemo } from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function TicketPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = useMemo(() => {
    const around = Math.min(3, totalPages);
    const start = Math.max(1, currentPage - 1);
    return Array.from({ length: around }, (_, i) => Math.min(start + i, totalPages));
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="mr-2.5 flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        Previous
      </button>

      <div className="flex items-center gap-2">
        {currentPage > 3 && <span className="px-2 text-gray-400">...</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
              currentPage === p
                ? "bg-brand-500 text-white"
                : "text-gray-700 hover:bg-blue-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
            }`}
          >
            {p}
          </button>
        ))}
        {currentPage < totalPages - 2 && <span className="px-2 text-gray-400">...</span>}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="ml-2.5 flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        Next
      </button>
    </div>
  );
}
