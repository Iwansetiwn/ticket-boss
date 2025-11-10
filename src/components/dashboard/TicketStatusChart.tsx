"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type StatusDatum = {
  status: string;
  count: number;
};

type Props = {
  data: StatusDatum[];
};

export default function TicketStatusChart({ data }: Props) {
  const chartConfig = useMemo(() => {
    const series = data.map((item) => item.count);
    const options: ApexOptions = {
      chart: {
        type: "donut",
        fontFamily: "Outfit, sans-serif",
      },
      labels: data.map((item) => item.status),
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        fontFamily: "Outfit, sans-serif",
        labels: { colors: "#94a3b8" },
      },
      dataLabels: { enabled: false },
      colors: ["#6366F1", "#34D399", "#FBBF24", "#F87171", "#A855F7"],
      tooltip: {
        y: {
          formatter: (val: number) => `${val} tickets`,
        },
      },
      stroke: { width: 0 },
    };

    return { series, options };
  }, [data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Status Breakdown</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Top statuses from your ticket queue</p>

      {data.length ? (
        <ReactApexChart options={chartConfig.options} series={chartConfig.series} type="donut" height={320} />
      ) : (
        <div className="py-14 text-center text-sm text-gray-500 dark:text-gray-400">
          Tickets don&apos;t have statuses yet. Add statuses to see this chart populate.
        </div>
      )}
    </div>
  );
}
