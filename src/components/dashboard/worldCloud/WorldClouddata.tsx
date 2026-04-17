"use client";

import { useEffect, useRef, useState } from "react";
import cloud from "d3-cloud";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import "d3-transition";

type Word = {
  text: string;
  value: number;
};

type CloudWord = Word & {
  x: number;
  y: number;
  size: number;
  rotate: number;
};

export default function WordCloudPage() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<Word[]>([]);

  const normalize = (str: string) =>
    str.toLowerCase().trim();

  const shuffle = (arr: any[]) =>
    arr
      .map((a) => ({ sort: Math.random(), value: a }))
      .sort((a, b) => a.sort - b.sort)
      .map((a) => a.value);

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        const bag = res?.bag_of_words || {};
        const map: Record<string, number> = {};

        Object.entries(bag).forEach(([_, words]: any) => {
          Object.entries(words || {}).forEach(([word, count]) => {
            const key = normalize(word);
            if (!key) return;
            map[key] = (map[key] || 0) + Number(count);
          });
        });

        let words: Word[] = Object.entries(map)
          .map(([text, value]) => ({ text, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 120);

        words = shuffle(words);

        setData(words);
      });
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const width = 900;   // 🔥 reduced for dashboard fit
    const height = 550;

    const max = Math.max(...data.map((d) => d.value));
    const min = Math.min(...data.map((d) => d.value));

    const fontScale = scaleLinear<number, number>()
      .domain([min, max])
      .range([14, 55]);

    const color = (value: number) => {
      if (value > max * 0.8) return "#7f1d1d";
      if (value > max * 0.6) return "#b91c1c";
      if (value > max * 0.4) return "#ea580c";
      if (value > max * 0.2) return "#f59e0b";
      return "#1f2937";
    };

    const layout = cloud<Word>()
      .size([width, height])
      .words(data.map((d) => ({ ...d })))
      .padding(2)
      .rotate(() => (Math.random() > 0.98 ? 90 : 0))
      .font("Impact")
      .fontSize((d) => fontScale(d.value))
      .on("end", draw);

    layout.start();

    function draw(words: CloudWord[]) {
      if (!svgRef.current) return;

      const svg = select(svgRef.current);
      svg.selectAll("*").remove();

      const group = svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      group
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("fill", (d) => color(d.value))
        .style("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .style("cursor", "pointer")
        .text((d) => d.text)

        // TOOLTIP
        .on("mouseenter", function (event, d) {
          if (!tooltipRef.current) return;

          const rect = (this as SVGTextElement).getBoundingClientRect();

          tooltipRef.current.style.display = "block";
          tooltipRef.current.style.left =
            rect.left + rect.width / 2 + "px";
          tooltipRef.current.style.top =
            rect.top - 30 + "px";

          tooltipRef.current.innerHTML = `${d.value}`;
        })
        .on("mouseleave", function () {
          if (!tooltipRef.current) return;
          tooltipRef.current.style.display = "none";
        });
    }
  }, [data]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">

      {/* TOOLTIP */}
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          display: "none",
          background: "#e99c9c",
          color: "#fff",
          padding: "6px 16px",
          fontSize: "14px",
          borderRadius: "8px",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* RESPONSIVE SVG */}
      <svg ref={svgRef} className="w-full h-full" />

    </div>
  );
}