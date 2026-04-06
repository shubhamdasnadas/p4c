"use client";

import { useEffect, useState } from "react";

export default function MonthlySalesChart() {
  const [groups, setGroups] = useState<any>({});
  const [filteredNews, setFilteredNews] = useState<any[]>([]);
  const [activeKeyword, setActiveKeyword] = useState<string>("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const keywords = [
    "ICICI Securities",
    "Geojit",
    "Kotak Securities",
    "Motilal Oswal Group",
    "Finance",
    "Zerodha",
  ];

  const clean = (t: any) =>
    typeof t === "string" ? t.replace(/<[^>]+>/g, "") : "";

  useEffect(() => {
    fetch("/api/opoint-news")
      .then((res) => res.json())
      .then((data) => {
        setGroups(data.groups || {});
      });
  }, []);

  // ✅ FILTER: ALL COMBINATIONS FOR SELECTED KEYWORD
  const handleKeywordClick = (keyword: string) => {
    // toggle (click again = reset)
    if (activeKeyword === keyword) {
      setActiveKeyword("");
      setFilteredNews([]);
      return;
    }

    setActiveKeyword(keyword);
    setOpenIndex(null);

    let result: any[] = [];

    Object.keys(groups).forEach((key) => {
      const words = key.split(" + ");

      // ✅ Include ALL combinations containing keyword
      if (words.includes(keyword)) {
        result = [...result, ...groups[key]];
      }
    });

    // ✅ Remove duplicates
    const unique = Array.from(
      new Map(result.map((item) => [item.title, item])).values()
    );

    // ✅ Sort latest
    unique.sort(
      (a: any, b: any) =>
        (b.published_at || 0) - (a.published_at || 0)
    );

    setFilteredNews(unique);
  };

  return (
    <div className="p-5 space-y-4">
      <h2 className="text-xl font-bold">📊 Multi Keyword News</h2>

      {/* ✅ KEYWORD BUTTONS ONLY */}
      <div className="flex gap-2 flex-wrap">
        {keywords.map((k) => (
          <button
            key={k}
            onClick={() => handleKeywordClick(k)}
            className={`px-3 py-1 rounded ${
              activeKeyword === k
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* ✅ NEWS LIST */}
      {filteredNews.map((n, i) => (
        <div
          key={i}
          className="border rounded-xl p-4 shadow hover:shadow-lg transition"
        >
          <div
            onClick={() =>
              setOpenIndex(openIndex === i ? null : i)
            }
            className="cursor-pointer"
          >
            <h3 className="text-blue-600 font-semibold">
              {clean(n.title)}
            </h3>

            <p className="text-xs text-gray-500">
              {n.source} •{" "}
              {n.published_at
                ? new Date(n.published_at).toLocaleString()
                : ""}
            </p>
          </div>

          {n.image_url && (
            <img
              src={n.image_url}
              className="w-full h-40 object-cover rounded mt-2"
            />
          )}

          <p className="text-sm mt-2">
            {clean(n.summary).slice(0, 150)}...
          </p>

          {openIndex === i && (
            <div className="mt-3 bg-gray-50 p-3 rounded text-xs space-y-1">
              <p><b>Author:</b> {n.article_details.author}</p>
              <p><b>Website:</b> {n.article_details.website}</p>
              <p><b>Word Count:</b> {n.article_details.word_count}</p>

              <p><b>🌍 Global Rank:</b> {n.article_details.global_rank}</p>
              <p><b>🇮🇳 Country Rank:</b> {n.article_details.country_rank}</p>

              <a
                href={n.url}
                target="_blank"
                className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white rounded"
              >
                Read Full Article
              </a>
            </div>
          )}
        </div>
      ))}

      {/* ✅ EMPTY STATE */}
      {activeKeyword === "" && (
        <p className="text-gray-500 text-sm">
          Select a keyword to view news
        </p>
      )}

      {activeKeyword && filteredNews.length === 0 && (
        <p className="text-gray-500 text-sm">
          No news found for "{activeKeyword}"
        </p>
      )}
    </div>
  );
}