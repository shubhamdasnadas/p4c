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
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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

  const closeModal = () => {
    setSelectedNews(null);
  };

  // Handle Esc key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (selectedNews) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedNews]);

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
          onClick={() => setSelectedNews(n)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedNews(n);
            }
          }}
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
            onClick={(e) => e.stopPropagation()}
          >
            Read Full Article
          </a>
        </div>
      ))}

      {selectedNews && (
        <div
          className="fixed inset-x-0 bottom-0 top-20 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl border rounded-lg p-6 space-y-2 hover:shadow-md transition bg-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-blue-600 font-semibold text-lg">
              {selectedNews.title}
            </h3>

            {selectedNews.image_url && (
              <img
                src={selectedNews.image_url}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/no-image.png";
                }}
                className="w-full h-56 object-cover rounded"
                alt="news"
              />
            )}

            <p className="text-sm text-gray-700 whitespace-pre-line">
              {selectedNews.body || selectedNews.summary || "No passage available."}
            </p>

            <p className="text-xs text-gray-500">
              Source: {selectedNews.source}
            </p>

            <p className="text-xs text-gray-400">
              {selectedNews.published_at
                ? new Date(selectedNews.published_at).toLocaleString()
                : "No date"}
            </p>

            <div className="flex gap-2 pt-1">
              <a
                href={selectedNews.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Read Full Article
              </a>
              <button
                type="button"
                onClick={closeModal}
                className="inline-block px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}