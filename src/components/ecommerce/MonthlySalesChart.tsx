"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

type Article = {
  headline?: string;
  publication?: string;
  collected_at?: string;
  url?: string;
};

export default function MonthlySalesChart() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedPublication, setSelectedPublication] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  /* ========= READ FILE DIRECTLY ========= */
  useEffect(() => {
    fetch("/entity_intelligence_live_results.jsonl")
      .then((res) => {
        if (!res.ok) throw new Error("File not found in /public");
        return res.text();
      })
      .then((text) => {
        const rows = text
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Article[];

        setArticles(rows);
      })
      .catch(console.error);
  }, []);

  /* ========= GROUP BY PUBLICATION ========= */
  const groupedByPublication = useMemo(() => {
    const map: Record<string, Article[]> = {};
    articles.forEach((a) => {
      const key = a.publication || "Unknown";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [articles]);

  /* ========= PUBLICATIONS ========= */
  const publications = useMemo(() => {
    return ["All", ...Object.keys(groupedByPublication)];
  }, [groupedByPublication]);

  /* ========= MONTHLY COUNTS (Chart) ========= */
  const monthlyData = useMemo(() => {
    const counts = Array(12).fill(0);

    articles.forEach((a) => {
      if (!a.collected_at) return;
      if (
        selectedPublication === "All" ||
        a.publication === selectedPublication
      ) {
        const d = new Date(a.collected_at);
        if (!isNaN(d.getTime())) {
          counts[d.getMonth()]++;
        }
      }
    });

    return counts;
  }, [articles, selectedPublication]);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#465fff"],
    plotOptions: {
      bar: { columnWidth: "40%", borderRadius: 6 },
    },
    dataLabels: { enabled: false },
    xaxis: { categories: MONTHS },
    yaxis: { title: { text: "Articles" } },
  };

  const series = [
    {
      name: selectedPublication,
      data: monthlyData,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-6">

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Articles Intelligence</h3>

        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}>
            <MoreDotIcon />
          </button>

          <Dropdown
            isOpen={dropdownOpen}
            onClose={() => setDropdownOpen(false)}
            className="w-48 p-2"
          >
            {publications.map((pub) => (
              <DropdownItem
                key={pub}
                onItemClick={() => {
                  setSelectedPublication(pub);
                  setDropdownOpen(false);
                }}
              >
                {pub}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* ===== CHART ===== */}
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={180}
      />

      {/* ===== ACCORDION ===== */}
      <div className="space-y-3">
        {Object.entries(groupedByPublication)
          .filter(
            ([pub]) =>
              selectedPublication === "All" || pub === selectedPublication
          )
          .map(([publication, news]) => (
            <div key={publication} className="border rounded-xl overflow-hidden">
              {/* Accordion Header */}
              <button
                onClick={() =>
                  setOpenAccordion(
                    openAccordion === publication ? null : publication
                  )
                }
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100"
              >
                <span className="font-semibold">
                  {publication} ({news.length})
                </span>
                <span className="text-xl">
                  {openAccordion === publication ? "▲" : "▼"}
                </span>
              </button>

              {/* Accordion Body */}
              {openAccordion === publication && (
                <div className="divide-y">
                  {news.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 text-sm">
                      <div className="font-medium">
                        {item.headline || "No headline"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.collected_at
                          ? new Date(item.collected_at).toLocaleString()
                          : "Unknown date"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
