"use client";

import { useEffect, useState } from "react";

type Article = {
  title: string;
  summary: string;
  url: string;
  source: string;
  matched_keywords: string[];
  tokens?: string[]; // ✅ ADD THIS
};

type Grouped = {
  [key: string]: Article[];
};

type KeywordCounts = {
  [key: string]: number;
};

export default function NewsDashboard() {
  const [grouped, setGrouped] = useState<Grouped>({});
  const [counts, setCounts] = useState<KeywordCounts>({});
  const [activeSection, setActiveSection] = useState<string>("Geojit Financial Service");

  const LABEL_MAP: Record<string, string[]> = {
    "Geojit Financial Service": ["geojit"],
    "ICICI Securities": ["icici securities", "icici"],
    "Kotak Securities": ["kotak securities", "kotak"],
    "Indiainfoline": ["indiainfoline"],
    "Motilal Oswal Group": ["motilal oswal", "motilal oswal group"],
    "Zerodha": ["zerodha"],
    "Angel One": ["angel one"],
    "Prudent": ["prudent"],
    "Groww": ["groww"],
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

  // ✅ SENTIMENT FROM API (not guessing anymore)
  const getSentiment = (a: any) => {
    return a.sentiment || "neutral";
  };

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        const articles = res.articles || [];
        const rawCounts = res.keyword_counts || {};

        const mergedCounts = buildMergedCounts(rawCounts);
        setCounts(mergedCounts);

        const result: Grouped = {};

        Object.entries(LABEL_MAP).forEach(([name, keywords]) => {
          let matched: Article[] = [];

          articles.forEach((a: Article) => {
            const articleKeywords = (a.matched_keywords || []).flatMap((k) =>
              k.split(",").map(normalize)
            );

            const isMatch = keywords.some((kw) =>
              articleKeywords.includes(normalize(kw))
            );

            if (isMatch) matched.push(a);
          });

          const unique = Array.from(
            new Map(matched.map((a) => [a.title, a])).values()
          );

          result[name] = unique;
        });

        setGrouped(result);
      });
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* TOP BAR */}
      <div className="w-full sticky top-0 bg-white shadow-sm z-10 px-4 py-3">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {Object.keys(LABEL_MAP).map((section) => {
            const count = counts[section] || 0;
            const isActive = activeSection === section;

            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-5 py-2 rounded-full whitespace-nowrap transition-all duration-300 
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
              >
                {section} 
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div className="w-full px-6 py-6">
        <div className="w-full">

          <div className="border rounded shadow-sm overflow-hidden bg-white">

            <div className="p-4 bg-gray-100 font-semibold text-lg">
              {activeSection} ({counts[activeSection] || 0})
            </div>

            <div className="p-4 space-y-4">

              {(grouped[activeSection] || []).length ? (
                grouped[activeSection].map((a, i) => {

                  const sentiment = getSentiment(a);

                  return (
                    <div
                      key={i}
                      className="border p-4 rounded hover:shadow-md transition"
                    >

                      <div className="flex items-start gap-3">

                        {/* SENTIMENT ICON */}
                        <div className="mt-1">
                          {sentiment === "positive" && (
                            <span className="text-green-600 font-bold text-lg">+</span>
                          )}
                          {sentiment === "negative" && (
                            <span className="text-red-600 font-bold text-lg">−</span>
                          )}
                          {sentiment === "neutral" && (
                            <span className="w-3 h-3 bg-gray-400 inline-block rounded-sm"></span>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-blue-600">
                            <a href={a.url} target="_blank">
                              {a.title}
                            </a>
                          </p>

                          <p className="text-xs text-gray-500">
                            {a.source}
                          </p>

                          {/* 🔥 TOKENS (FIXED HERE) */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(a.tokens || [])
                              .slice(0, 5)
                              .map((t, idx) => (
                                <span
                                  key={idx}
                                  className="bg-yellow-100 text-xs px-2 py-1 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-gray-400">No data found</div>
              )}

            </div>

          </div>

        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}