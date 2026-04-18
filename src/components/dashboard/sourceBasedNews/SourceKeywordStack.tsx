
"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const colors = [
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#fb7185",
  "#ec4899",
  "#a855f7",
  "#6366f1",
  "#14b8a6",
  "#84cc16",
  "#6b7280",
  "#0ea5e9",
  "#22c55e",
  "#f43f5e",
  "#8b5cf6",
  "#facc15",
];

const SourceKeywordGraph = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        const sourceCount = res?.source_counts;
        const keywordBreakdown = res?.source_keyword_breakdown;

        if (!sourceCount || !keywordBreakdown) {
          setChartData([]);
          return;
        }

        const topSources = Object.entries(sourceCount)
          .map(([source, count]: any) => ({
            source,
            count: Number(count) || 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const globalKeywordMap: Record<string, number> = {};

        const data = topSources.map((item) => {
          const obj: any = {
            source: item.source,
          };

          const keywordsObj = keywordBreakdown[item.source] || {};

          // Combine similar keyword names
          const mergedKeywords: Record<string, number> = {};

          Object.entries(keywordsObj).forEach(([keyword, count]: any) => {
            const normalizedKeyword = keyword
              .toLowerCase()
              .replace(/[^a-z0-9 ]/g, "")
              .trim();

            let matchedKey = Object.keys(mergedKeywords).find((existingKey) => {
              const normalizedExisting = existingKey
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .trim();

              return (
                normalizedKeyword.includes(normalizedExisting) ||
                normalizedExisting.includes(normalizedKeyword)
              );
            });

            if (matchedKey) {
              mergedKeywords[matchedKey] += Number(count) || 0;
            } else {
              mergedKeywords[keyword] = Number(count) || 0;
            }
          });

          const sortedKeywords = Object.entries(mergedKeywords)
            .map(([keyword, count]) => ({
              name: keyword,
              count: Number(count) || 0,
            }))
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count);

          // Show all keywords instead of only top 5
          sortedKeywords.forEach((keyword) => {
            obj[keyword.name] = keyword.count;

            globalKeywordMap[keyword.name] =
              (globalKeywordMap[keyword.name] || 0) + keyword.count;
          });

          return obj;
        });

        const finalKeys = Object.entries(globalKeywordMap)
          .sort((a, b) => b[1] - a[1])
          .map(([key]) => key);

        const generatedColorMap: Record<string, string> = {};

        finalKeys.forEach((key, index) => {
          generatedColorMap[key] = colors[index % colors.length];
        });

        setChartData(data);
        setKeys(finalKeys);
        setColorMap(generatedColorMap);
      })
      .catch((err) => {
        console.error("Chart API Error:", err);
        setChartData([]);
      });
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const filteredPayload = payload
      .filter((entry: any) => entry.value > 0)
      .sort((a: any, b: any) => b.value - a.value);

    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          maxHeight: "350px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          {label}
        </div>

        {filteredPayload.map((entry: any, index: number) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: entry.color,
                marginRight: "8px",
                flexShrink: 0,
              }}
            />

            <span
              style={{
                color: entry.color,
                fontSize: "13px",
                fontWeight: 500,
                wordBreak: "break-word",
              }}
            >
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "700px",
        padding: "20px",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "18px",
          fontWeight: 600,
        }}
      >
        Clean Keyword Distribution (Top Sources)
      </h2>

      {chartData.length === 0 && (
        <p style={{ textAlign: "center", color: "red" }}>
          No data available
        </p>
      )}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="source"
              interval={0}
              angle={-25}
              textAnchor="end"
              height={90}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              label={{
                value: "Keyword Count",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
              }}
            />

            {keys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={colorMap[key] || colors[index % colors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SourceKeywordGraph;

