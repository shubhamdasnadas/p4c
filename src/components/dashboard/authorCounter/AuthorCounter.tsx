"use client";

import { useEffect, useState } from "react";

type AuthorCounts = {
  [key: string]: number;
};

export default function AuthorCounter() {
  const [authors, setAuthors] = useState<AuthorCounts>({});

  const normalize = (str: string) =>
    str.toLowerCase().trim();

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        const articles = res?.articles || [];

        const map: AuthorCounts = {};

        articles.forEach((item: any) => {
          const authorRaw =
            item?.author ||
            item?.authors ||
            item?.byline ||
            "Unknown";

          const author = normalize(authorRaw);

          if (!author) return;

          map[author] = (map[author] || 0) + 1;
        });

        setAuthors(map);
      });
  }, []);

  const sorted = Object.entries(authors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="w-full h-full flex flex-col px-5 py-4">

      {/* 🔥 HEADER (ALIGNED LIKE SENTIMENT CARD) */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Top 5 Authors
      </h2>

      {/* 🔥 TABLE */}
      <div className="flex-1 flex items-center justify-center">

        <table className="w-full text-sm">

          {/* HEADER */}
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-200">
              <th className="text-left pb-2">Author</th>
              <th className="text-right pb-2">Count</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {sorted.length ? (
              sorted.map(([author, count]) => (
                <tr
                  key={author}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-3 text-gray-800 font-medium capitalize">
                    {author}
                  </td>

                  <td className="py-3 text-right font-semibold text-indigo-600">
                    {count}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="text-center py-6 text-gray-400 text-sm"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>

        </table>

      </div>
    </div>
  );
}