"use client";

import { useEffect, useState } from "react";

type Article = {
  title?: string;
  source?: string;
  sentiment?: string;
};

export default function ReportNewsList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        setArticles(res?.articles || []);
      });
  }, []);

  const totalPages = Math.ceil(articles.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = articles.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // ✅ sentiment color
  const getRowColor = (sentiment?: string) => {
    if (sentiment === "positive") return "bg-green-50";
    if (sentiment === "negative") return "bg-red-50";
    return "bg-gray-50";
  };

  return (
    <div className="w-full h-full flex flex-col px-5 py-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Latest News Titles
        </h2>

        <span className="text-xs text-gray-400">
          {articles.length} Articles
        </span>
      </div>

      {/* TABLE */}
      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>

              <th className="px-3 py-2 text-left">Title</th>
            </tr>
          </thead>

          <tbody>
            {currentData.map((item, index) => {
              const globalIndex =
                (currentPage - 1) * itemsPerPage + index + 1;

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-100 hover:bg-indigo-50/40 transition ${getRowColor(
                    item?.sentiment
                  )}`}
                >
                 

                  <td
                    className="px-3 py-3 text-gray-700 cursor-pointer"
                    title={item?.title || ""}
                  >
                    <div className="truncate max-w-[600px] font-medium">
                      {item?.title || ""}
                    </div>

                    {/* SOURCE + SENTIMENT */}
                    <div className="flex items-center gap-3 mt-0.5 text-xs">
                      <span className="text-gray-500">
                        {item?.source || "Unknown Source"}
                      </span>

                      {/* <span
                        className={`px-2 py-[2px] rounded-full text-[10px] font-medium
                          ${
                            item?.sentiment === "positive"
                              ? "bg-green-200 text-green-700"
                              : item?.sentiment === "negative"
                              ? "bg-red-200 text-red-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                      >
                        {item?.sentiment || "neutral"}
                      </span> */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4">

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.max(prev - 1, 1))
          }
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm rounded-lg border bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition"
        >
          ← Prev
        </button>

        <div className="text-sm font-medium text-gray-600">
          Page{" "}
          <span className="text-indigo-600">
            {currentPage}
          </span>{" "}
          of {totalPages || 1}
        </div>

        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, totalPages)
            )
          }
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm rounded-lg border bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition"
        >
          Next →
        </button>

      </div>
    </div>
  );
}