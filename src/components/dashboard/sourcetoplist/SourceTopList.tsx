"use client";

import React, { useEffect, useState } from "react";

type SourceData = {
    source: string;
    count: number;
    percent: number;
};

const colors = [
    "#f59e0b",
    "#f97316",
    "#ef4444",
    "#fb7185",
    "#ec4899",
    "#a855f7",
    "#6366f1",
    "#0ea5e9",
    "#14b8a6",
    "#22c55e",
];

const SourceTopList = () => {
    const [data, setData] = useState<SourceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/opointNews")
            .then((res) => res.json())
            .then((res) => {
                const sourceCount = res?.source_counts;

                if (!sourceCount || typeof sourceCount !== "object") {
                    setData([]);
                    return;
                }

                const formatted = Object.entries(sourceCount).map(
                    ([source, count]: any) => ({
                        source: String(source),
                        count: Number(count) || 0,
                    })
                );

                // 🔥 TOTAL ARTICLES
                const total =
                    formatted.reduce((sum, item) => sum + item.count, 0) || 1;

                // 🔥 SORT ALL
                const sorted = formatted.sort((a, b) => b.count - a.count);

                // ✅ TOP 9
                const top9 = sorted.slice(0, 9);

                // ✅ OTHERS (remaining)
                const othersCount = sorted
                    .slice(9)
                    .reduce((sum, item) => sum + item.count, 0);

                const finalData = [...top9];

                if (othersCount > 0) {
                    finalData.push({
                        source: "Others",
                        count: othersCount,
                    });
                }

                // ✅ % based on TOTAL
                const withPercent = finalData.map((item) => ({
                    ...item,
                    percent: Number(((item.count / total) * 100).toFixed(2)),
                }));

                setData(withPercent);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ width: "100%", padding: "20px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
                Top 10 Sources
            </h2>

            {loading && <p>Loading...</p>}

            {!loading && data.length === 0 && (
                <p style={{ color: "red", textAlign: "center" }}>
                    No data available
                </p>
            )}

            {!loading && data.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "30px",
                        justifyItems: "center",
                    }}
                >
                    {data.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                textAlign: "center",
                                position: "relative",
                            }}
                        >
                            {/* 🔥 Tooltip */}
                            {hoverIndex === index && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "-35px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: colors[index],
                                        color: "#fff",
                                        padding: "5px 10px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        whiteSpace: "nowrap",
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                                        zIndex: 10,
                                    }}
                                >
                                    {item.source}: {item.count}
                                </div>
                            )}

                            {/* 🔥 Cylinder */}
                            <div
                                onMouseEnter={() => setHoverIndex(index)}
                                onMouseLeave={() => setHoverIndex(null)}
                                style={{
                                    width: "60px",
                                    height: "200px",
                                    borderRadius: "30px",
                                    background:
                                        "linear-gradient(to bottom, #d1d5db, #9ca3af)", // glass
                                    position: "relative",
                                    overflow: "hidden",
                                    boxShadow: "inset 0 6px 12px rgba(0,0,0,0.15)",
                                    cursor: "pointer",
                                }}
                            >
                                {/* 🔥 Fill */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        width: "100%",
                                        height: `${item.percent}%`,
                                        background: colors[index],
                                        borderRadius: "30px 30px 0 0",
                                        transition: "height 0.6s ease",
                                    }}
                                />

                                {/* ✨ Glass highlight */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "10%",
                                        width: "80%",
                                        height: "20px",
                                        borderRadius: "50%",
                                        background:
                                            "radial-gradient(circle, rgba(255,255,255,0.6), transparent)",
                                    }}
                                />
                            </div>

                            {/* % */}
                            <div
                                style={{
                                    marginTop: "10px",
                                    fontWeight: "bold",
                                    color: colors[index],
                                }}
                            >
                                {item.percent.toFixed(1)}%
                            </div>

                            {/* Source */}
                            <div
                                style={{
                                    fontSize: "12px",
                                    marginTop: "5px",
                                    color: "#444",
                                }}
                            >
                                {item.source}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SourceTopList;