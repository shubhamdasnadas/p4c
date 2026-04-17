"use client";

import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type SentimentData = {
    positive: number;
    negative: number;
    neutral: number;
};

type BrandSentiment = {
    [key: string]: SentimentData;
};

export default function SentimentCounter() {
    const [data, setData] = useState<BrandSentiment>({});
    const [selectedBrand, setSelectedBrand] = useState<string>("Geojit");
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const LABEL_MAP: Record<string, string[]> = {
        Geojit: ["geojit"],
        "ICICI Securities": ["icici securities", "icici"],
        "Kotak Securities": ["kotak securities", "kotak"],
        Indiainfoline: ["indiainfoline"],
        "Motilal Oswal Group": ["motilal oswal group"],
        Zerodha: ["zerodha"],
        "Angel One": ["angel one"],
        Prudent: ["prudent"],
        Groww: ["groww"],
    };

    const normalize = (str: string) =>
        str.toLowerCase().trim();

    useEffect(() => {
        fetch("/api/opointNews")
            .then((res) => res.json())
            .then((res) => {
                const raw = res?.sentiment_by_brand || {};

                const finalData: BrandSentiment = {};

                Object.entries(LABEL_MAP).forEach(([brand, keywords]) => {
                    let positive = 0;
                    let negative = 0;
                    let neutral = 0;

                    Object.entries(raw).forEach(([rawKey, value]: any) => {
                        const parts = rawKey
                            .toLowerCase()
                            .split(/[.,]/)
                            .map((k: any) => k.trim());

                        const match = keywords.some((kw) =>
                            parts.includes(normalize(kw))
                        );

                        if (match) {
                            positive += value?.positive || 0;
                            negative += value?.negative || 0;
                            neutral += value?.neutral || 0;
                        }
                    });

                    finalData[brand] = { positive, negative, neutral };
                });

                setData(finalData);
            });
    }, []);

    const current = data[selectedBrand] || {
        positive: 0,
        negative: 0,
        neutral: 0,
    };

    const total =
        current.positive + current.negative + current.neutral;

    const chartData = [
        { name: "Positive", value: current.positive || 0.01 },
        { name: "Neutral", value: current.neutral || 0.01 },
        { name: "Negative", value: current.negative || 0.01 },
    ];

    const COLORS = ["#86efac", "#e5e7eb", "#fca5a5"];

    return (
        <div className="w-full h-full flex flex-col items-center px-6">

            {/* HEADER */}
            <div className="w-full flex justify-between items-center mt-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Sentiment by Brand
                </h2>

                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="border px-3 py-1 rounded-md text-sm cursor-pointer"
                >
                    {Object.keys(LABEL_MAP).map((brand) => (
                        <option key={brand}>{brand}</option>
                    ))}
                </select>
            </div>

            {/* 🔥 BIGGER CHART CONTAINER */}
            <div className="w-full h-[480px] relative flex justify-center items-center">

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={selectedBrand}>

                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={160}   // 🔥 INCREASED
                            innerRadius={80}    // 🔥 INCREASED
                            dataKey="value"
                            stroke="none"
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            isAnimationActive
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={COLORS[index]}
                                    style={{
                                        transform:
                                            activeIndex === index
                                                ? "scale(1.1)"
                                                : "scale(1)",
                                        transformOrigin: "center",
                                        transition: "0.3s",
                                        cursor: "pointer",
                                    }}
                                />
                            ))}
                        </Pie>

                        <Tooltip
                            formatter={(value: any, name: any) => [
                                value.toFixed(0),
                                name,
                            ]}
                        />

                    </PieChart>
                </ResponsiveContainer>

                {/* 🔥 CENTER LABEL BIGGER */}
                <div className="absolute text-center">
                    <div className="text-3xl font-bold text-gray-800">
                        {total}
                    </div>
                    <div className="text-sm text-gray-500">
                        Total Mentions
                    </div>
                </div>

            </div>

            {/* LEGEND */}
            <div className="flex gap-6 mt-4 text-sm">

                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-300 rounded-full"></span>
                    Positive
                </div>

                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                    Neutral
                </div>

                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-300 rounded-full"></span>
                    Negative
                </div>

            </div>

        </div>
    );
}