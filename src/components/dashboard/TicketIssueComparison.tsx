"use client";

import React, { useMemo } from "react";

type IssueDatum = {
  category: string;
  count: number;
};

type Props = {
  data: IssueDatum[];
};

const barGradients = [
  "from-brand-500 to-indigo-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-500",
  "from-sky-500 to-cyan-400",
  "from-purple-500 to-fuchsia-500",
];

export default function TicketIssueComparison({ data }: Props) {
  const bars = useMemo(() => {
    if (!data.length) return [];

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const maxCount = Math.max(...data.map((item) => item.count));

    return data.map((item, index) => {
      const relative = maxCount ? item.count / maxCount : 0;
      const width = Math.max(relative * 100, 8);
      const percent = total ? ((item.count / total) * 100).toFixed(1) : "0.0";
      const anchorRight = relative > 0.82;

      return {
        ...item,
        width,
        percent,
        anchorRight,
        gradient: barGradients[index % barGradients.length],
      };
    });
  }, [data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Issue Comparison</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Horizontal bars scale with the share of tickets per category
          </p>
        </div>
      </div>

      {bars.length ? (
        <div className="mt-6 flex flex-col gap-5">
          {bars.map((bar) => (
            <div key={bar.category} className="group">
              <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>{bar.category}</span>
                <span>{bar.count} issues</span>
              </div>
              <div className="mt-3 h-4 w-full rounded-full bg-gray-100 dark:bg-white/10">
                <div
                  className={`relative h-full rounded-full bg-gradient-to-r ${bar.gradient} shadow-lg transition-all duration-300 group-hover:opacity-90`}
                  style={{ width: `${bar.width}%` }}
                >
                  <span
                    className={`pointer-events-none absolute -top-3 z-10 -translate-y-full whitespace-nowrap rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-2xl transition group-hover:-translate-y-[calc(100%+6px)] group-hover:opacity-100 dark:!bg-white dark:!text-gray-900 ${
                      bar.anchorRight ? "right-0" : "left-full ml-2"
                    }`}
                  >
                    {bar.category}: {bar.count} issues ({bar.percent}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No issue categories available yet. Start labeling tickets to compare issues.
        </div>
      )}
    </div>
  );
}
