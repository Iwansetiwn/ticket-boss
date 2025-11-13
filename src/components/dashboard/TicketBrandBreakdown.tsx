"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import React, { useMemo, useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type BrandDatum = {
  brand: string;
  count: number;
};

type Props = {
  allTime: BrandDatum[];
  today: BrandDatum[];
};

const brandColors = ["#6366F1", "#34D399", "#FBBF24", "#F87171", "#A855F7", "#0EA5E9", "#FB7185"];

export default function TicketBrandBreakdown({ allTime, today }: Props) {
  const [range, setRange] = useState<"all" | "today">("all");
  const data = range === "all" ? allTime : today;

  const config = useMemo(() => {
    const series = data.map((item) => item.count);
    const totalTickets = series.reduce((acc, curr) => acc + curr, 0);
    const options: ApexOptions = {
      chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
      labels: data.map((item) => item.brand),
      colors: brandColors,
      legend: { show: true, position: "bottom", fontFamily: "Outfit, sans-serif" },
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 90,
          offsetY: 20,
          expandOnClick: true,
          donut: {
            size: "78%",
            labels: { show: false },
          },
          dataLabels: {
            offset: -6,
          },
        },
      },
      grid: {
        padding: { top: -10, bottom: -10 },
      },
      tooltip: {
        theme: "light",
        fillSeriesColor: false,
        style: {
          fontFamily: "Outfit, sans-serif",
        },
        y: {
          formatter: (val: number, opts) => {
            const percent = totalTickets ? ((val / totalTickets) * 100).toFixed(1) : "0.0";
            const label = data[opts.seriesIndex]?.brand ?? "Category";
            return `${label}: ${val} tickets (${percent}%)`;
          },
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: 6, colors: ["rgba(15,23,42,0.12)"] },
    };

    return { series, options };
  }, [data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Brand Breakdown</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range === "all" ? "All-time ticket distribution" : "Tickets created today"}
          </p>
        </div>
        <div className="flex rounded-full border border-gray-200 p-1 text-xs dark:border-gray-700">
          {[
            { label: "All time", value: "all" as const },
            { label: "Today", value: "today" as const },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`rounded-full px-3 py-1 font-medium transition ${
                range === option.value
                  ? "bg-gray-900 text-white dark:!bg-white dark:!text-gray-900"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {data.length ? (
        <div className="mt-2 flex justify-center">
          <ReactApexChart options={config.options} series={config.series} type="donut" height={320} />
        </div>
      ) : (
        <div className="py-14 text-center text-sm text-gray-500 dark:text-gray-400">
          No brand data available for this range.
        </div>
      )}
    </div>
  );
}
