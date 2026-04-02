"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  summary: string;
  body: string;
  image_url: string;
  source: string;
  published_at: number | null;
  url: string;
};

export default function MonthlySalesChart() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Remove <match> tags
  const cleanText = (text: string) => {
    if (!text) return "";
    return text.replace(/<[^>]+>/g, "");
  };

  useEffect(() => {
    fetch("/api/opoint-news", {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("FINAL NEWS", data);

        const formatted: NewsItem[] = (data.articles || []).map(
          (item: any) => ({
            title: cleanText(item?.title || "No title"),
            summary: cleanText(item?.summary || ""),
            body: cleanText(item?.body || ""),
            image_url: item?.image_url || "",
            source: item?.source || "Unknown",
            published_at: item?.published_at || null,
            url: item?.url || "#",
          })
        );

        // ✅ Remove empty titles
        const filtered = formatted.filter(
          (item) => item.title && item.title !== "No title"
        );

        // ✅ Remove duplicates
        const unique = Array.from(
          new Map(filtered.map((item) => [item.title, item])).values()
        );

        // ✅ Sort latest first
        unique.sort(
          (a, b) => (b.published_at || 0) - (a.published_at || 0)
        );

        setNews(unique);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4">
      <h2 className="text-lg font-bold">Latest Headlines</h2>

      {/* ✅ Loading */}
      {loading && <p>Loading news...</p>}

      {/* ❌ No Data */}
      {!loading && news.length === 0 && (
        <p>No news found</p>
      )}

      {/* ✅ News List */}
      {news.map((n, i) => (
        <div
          key={i}
          className="border rounded-lg p-3 space-y-2 hover:shadow-md transition"
        >
          <h3 className="text-blue-600 font-semibold">
            {n.title}
          </h3>

          {/* ✅ Image with fallback */}
          {n.image_url && (
            <img
              src={n.image_url}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/no-image.png";
              }}
              className="w-full h-40 object-cover rounded"
              alt="news"
            />
          )}

          <p className="text-sm text-gray-700">
            {n.summary.slice(0, 200)}...
          </p>

          <p className="text-xs text-gray-500">
            Source: {n.source}
          </p>

          <p className="text-xs text-gray-400">
            {n.published_at
              ? new Date(n.published_at).toLocaleString()
              : "No date"}
          </p>

          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Read Full Article
          </a>
        </div>
      ))}
    </div>
  );
}