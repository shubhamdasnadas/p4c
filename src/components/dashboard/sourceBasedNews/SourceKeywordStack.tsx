"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";

type ChartRow = {
  keyword: string;
  [key: string]: any;
};

const COLORS = [
  "#22c55e",
  "#0ea5e9",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#6366f1",
  "#94a3b8",
];

const KeywordSourceStack = () => {
  const [data, setData] = useState<ChartRow[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        const articles = res?.articles || [];

        console.log("ARTICLE SAMPLE 👉", articles[0]);

        if (!articles.length) {
          setData([]);
          return;
        }

        const keywordMap: Record<string, Record<string, number>> = {};

        articles.forEach((a: any) => {
          const source = a?.source?.name || "Unknown";

          // 🔥 UNIVERSAL KEYWORD EXTRACTION
          let keywords: string[] = [];

          if (Array.isArray(a?.match_keywords)) {
            keywords = a.match_keywords;
          } else if (a?.match_keyword) {
            keywords = [a.match_keyword];
          } else if (Array.isArray(a?.keywords)) {
            keywords = a.keywords;
          } else if (a?.keyword) {
            keywords = [a.keyword];
          } else {
            return; // ❌ skip if no keyword
          }

          keywords.forEach((kw) => {
            const keyword = String(kw).trim();

            if (!keyword) return;

            if (!keywordMap[keyword]) keywordMap[keyword] = {};

            keywordMap[keyword][source] =
              (keywordMap[keyword][source] || 0) + 1;
          });
        });

        // ❗ if still empty
        if (Object.keys(keywordMap).length === 0) {
          console.warn("No keyword mapping created");
          setData([]);
          return;
        }

        // ✅ Convert to %
        const rows: ChartRow[] = Object.entries(keywordMap).map(
          ([keyword, sourcesObj]) => {
            const total = Object.values(sourcesObj).reduce(
              (a, b) => a + Number(b),
              0
            );

            const row: ChartRow = { keyword };

            Object.entries(sourcesObj).forEach(([src, val]) => {
              row[src] = Number(((val / total) * 100).toFixed(2));
            });

            return row;
          }
        );

        // ✅ Top 10 keywords
        const sorted = Object.entries(keywordMap)
          .map(([keyword, srcs]) => ({
            keyword,
            total: Object.values(srcs).reduce(
              (a, b) => a + Number(b),
              0
            ),
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
          .map((item) =>
            rows.find((r) => r.keyword === item.keyword)
          )
          .filter((r): r is ChartRow => Boolean(r));

        // ✅ Collect sources
        const allSources = new Set<string>();
        sorted.forEach((row) => {
          Object.keys(row).forEach((k) => {
            if (k !== "keyword") allSources.add(k);
          });
        });

        setSources(Array.from(allSources));
        setData(sorted);

        console.log("FINAL DATA 👉", sorted);
      })
      .catch((err) => {
        console.error("ERROR 👉", err);
        setData([]);
      });
  }, []);

  return (
    <div style={{ width: "100%", height: "500px", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Top Publications (Articles)
      </h2>

      {data.length === 0 && (
        <p style={{ textAlign: "center", color: "red" }}>
          No data available
        </p>
      )}

      {data.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="keyword"
              angle={-30}
              textAnchor="end"
              interval={0}
              height={80}
            />

            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />

            <Tooltip
              formatter={(value: any, name: any) => [
                `${Number(value).toFixed(2)}%`,
                String(name),
              ]}
            />

            <Legend />

            {sources.map((src, i) => (
              <Bar
                key={src}
                dataKey={src}
                stackId="a"
                fill={COLORS[i % COLORS.length]}
              >
                <LabelList
                  dataKey={src}
                  position="center"
                  formatter={(v: any) =>
                    v > 5 ? v.toFixed(2) : ""
                  }
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default KeywordSourceStack;