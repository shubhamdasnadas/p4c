"use client";

import { useEffect, useState } from "react";

type Article = {
  title?: string;
  sentiment?: "positive" | "negative" | "neutral";
};

const MarqueeNewsHeader = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        setArticles(res?.articles || []);
      });
  }, []);

  // 🎨 BORDER COLOR
  const getBorderColor = (sentiment?: string) => {
    if (sentiment === "positive") return "#22c55e";
    if (sentiment === "negative") return "#ef4444";
    return "#9ca3af";
  };

  // 🔥 BUILD HTML STRING
  const marqueeHTML = `
    <marquee 
      behavior="scroll" 
      direction="left" 
      scrollamount="4"
      onmouseover="this.stop();" 
      onmouseout="this.start();"
      style="display:flex; align-items:center;"
    >
      <div style="display:flex; gap:16px; align-items:center;">
        ${articles
          .map(
            (item) => `
          <div 
            style="
              display:inline-block;
              background:#fff;
              border:2px solid ${getBorderColor(item?.sentiment)};
              border-radius:6px;
              padding:8px 16px;
              box-shadow:0 1px 2px rgba(0,0,0,0.1);
            "
          >
            <div 
              style="
                width:350px;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                font-size:14px;
                color:#374151;
              "
              title="${item?.title || ""}"
            >
              ${item?.title || "No Title"}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </marquee>
  `;

  return (
    <div className="w-full max-w-7xl mx-auto flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-md">

      {/* LABEL */}
      <div className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm font-semibold whitespace-nowrap">
        Top Stories
      </div>

      {/* 🔥 MARQUEE RENDER */}
      <div
        className="flex-1 overflow-hidden"
        dangerouslySetInnerHTML={{ __html: marqueeHTML }}
      />
    </div>
  );
};

export default MarqueeNewsHeader;