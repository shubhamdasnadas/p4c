"use client";

import { useEffect, useState } from "react";
import { hierarchy, pack } from "d3-hierarchy";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

type KeywordCounts = {
    [key: string]: number;
};

type BubbleNode = {
    name: string;
    value?: number;
    children?: BubbleNode[];
};

export default function ArticleCounter() {
    const [counts, setCounts] = useState<KeywordCounts>({});
    const [view, setView] = useState("table");

    const LABEL_MAP: Record<string, string[]> = {
        "Geojit Financial Service": ["geojit"],
        "ICICI Securities": ["icici securities", "icici"],
        "Kotak Securities": ["kotak securities", "kotak"],
        Indiainfoline: ["indiainfoline"],
        "Motilal Oswal Group": ["motilal oswal", "motilal oswal group"],
        Zerodha: ["zerodha"],
        "Angel One": ["angel one"],
        Prudent: ["prudent"],
        Groww: ["groww"],
    };

    const normalize = (str: string) =>
        str.toLowerCase().trim();

    const buildMergedCounts = (rawCounts: KeywordCounts) => {
        const finalCounts: KeywordCounts = {};

        Object.entries(LABEL_MAP).forEach(([uiKey, keywords]) => {
            let total = 0;

            Object.entries(rawCounts).forEach(([rawKey, value]) => {
                const parts = rawKey
                    .toLowerCase()
                    .split(/[.,]/)
                    .map((k) => k.trim());

                const isMatch = keywords.some((kw) =>
                    parts.includes(normalize(kw))
                );

                if (isMatch) total += value;
            });

            finalCounts[uiKey] = total;
        });

        return finalCounts;
    };

    useEffect(() => {
        fetch("/api/opointNews")
            .then((res) => res.json())
            .then((res) => {
                const rawCounts = res.keyword_counts || {};
                setCounts(buildMergedCounts(rawCounts));
            });
    }, []);

    const sorted = Object.entries(counts).sort(
        (a, b) => b[1] - a[1]
    );

    const chartData = sorted.map(([name, value], index) => ({
        name,
        value,
        x: index + 1,
        y: value,
    }));

    const wrapText = (text: string, radius: number) => {
        const words = text.split(" ");
        const lines: string[] = [];

        let currentLine = "";

        words.forEach((word) => {
            const testLine = currentLine + word + " ";

            // 🔥 control max characters based on circle size
            if (testLine.length > radius / 3) {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) lines.push(currentLine.trim());

        // 🔥 dynamic font size
        const fontSize = Math.min(radius / 3.5, 14);

        return lines.map((line, i) => (
            <tspan
                key={i}
                x="0"
                dy={i === 0 ? "0em" : "1.2em"}
                style={{ fontSize: `${fontSize}px` }}
            >
                {line}
            </tspan>
        ));
    };
    return (
        <div className="w-full h-full flex flex-col p-4">

            {/* HEADER */}
            <div className="mb-3 flex justify-between items-center">
                <div className="text-lg font-semibold">
                   
                </div>

                <select
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    className="border px-4 py-2 rounded-md"
                >
                    <option value="table">Table</option>
                    <option value="line">Line Chart</option>
                    <option value="bubble">Bubble View</option>
                </select>
            </div>

            {/* CONTENT */}
            <div className="bg-gray-50 rounded-lg flex-1 flex items-center justify-center overflow-hidden">

                {/* TABLE */}
                {view === "table" && (
                    <div className="w-full h-full flex justify-center items-center">
                        <div className="w-[80%] max-w-3xl bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100 text-sm">
                                        <th className="px-4 py-2 text-left">Keyword</th>
                                        <th className="px-4 py-2 text-right">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map(([key, value]) => (
                                        <tr key={key} className="border-t">
                                            <td className="px-4 py-2">{key}</td>
                                            <td className="px-4 py-2 text-right">{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* LINE */}
                {view === "line" && (
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid stroke="#e5e7eb" />
                                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={60} />
                                <YAxis />
                                <Tooltip />
                                <Line dataKey="value" stroke="#6366f1" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* ✅ FINAL PREMIUM BUBBLE */}
                {view === "bubble" && (
                    <div className="flex justify-center items-center w-full h-full relative">

                        <div
                            id="bubble-tooltip"
                            className="hidden fixed text-xs px-3 py-2 rounded-lg shadow pointer-events-none z-50"
                        />

                        <svg width={480} height={480}>
                            {(() => {

                                const stableData = [...chartData].sort(
                                    (a, b) => b.value - a.value
                                );

                                const rootData: BubbleNode = {
                                    name: "root",
                                    children: stableData.map((d) => ({
                                        name: d.name,
                                        value: d.value,
                                    })),
                                };

                                const root = hierarchy<BubbleNode>(rootData)
                                    .sum((d) => d.value ?? 0);

                                const packed = pack<BubbleNode>()
                                    .size([440, 440])
                                    .padding(12)(root);

                                return packed.leaves().map((node, i) => {
                                    const original = stableData[i];

                                    const color = `hsl(${(i * 45) % 360}, 70%, 70%)`;

                                    // 🔥 FONT SIZE BASED ON CIRCLE
                                    const fontSize = Math.min(node.r / 3, 16);

                                    return (
                                        <g
                                            key={i}
                                            transform={`translate(${node.x},${node.y})`}
                                            style={{ cursor: "pointer", transition: "0.2s" }}

                                            onMouseMove={(e) => {
                                                const tooltip = document.getElementById("bubble-tooltip");
                                                if (!tooltip) return;

                                                tooltip.style.display = "block";
                                                tooltip.style.left = e.clientX + 10 + "px";
                                                tooltip.style.top = e.clientY - 30 + "px";
                                                tooltip.style.background = color;

                                                tooltip.innerHTML = `
                          <div><b>${original.name}</b></div>
                          <div>Count: ${original.value}</div>
                        `;

                                                (e.currentTarget as SVGGElement).setAttribute(
                                                    "transform",
                                                    `translate(${node.x},${node.y}) scale(1.08)`
                                                );
                                            }}

                                            onMouseLeave={(e) => {
                                                const tooltip = document.getElementById("bubble-tooltip");
                                                if (tooltip) tooltip.style.display = "none";

                                                (e.currentTarget as SVGGElement).setAttribute(
                                                    "transform",
                                                    `translate(${node.x},${node.y}) scale(1)`
                                                );
                                            }}
                                        >
                                            <circle r={node.r} fill={color} />

                                            {/* ✅ TEXT INSIDE */}
                                            <text
                                                textAnchor="middle"
                                                style={{
                                                    fill: "#000",
                                                    pointerEvents: "none",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {wrapText(original.name, node.r)}
                                            </text>
                                        </g>
                                    );
                                });
                            })()}
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}