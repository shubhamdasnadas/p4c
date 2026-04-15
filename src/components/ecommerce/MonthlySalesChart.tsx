"use client";

import { useEffect, useState } from "react";

type Article = {
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: number;
  matched_keywords: string[];
};

type Grouped = {
  [key: string]: Article[];
};

export default function NewsDashboard() {
  const [grouped, setGrouped] = useState<Grouped>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((data) => {
        const map: Grouped = {};
        console.log("data", data)
        data.articles.forEach((a: Article) => {
          a.matched_keywords.forEach((k) => {
            if (!map[k]) map[k] = [];
            map[k].push(a);
          });
        });

        setGrouped(map);
      });
  }, []);

  const articles = selected ? grouped[selected] || [] : [];

  return (
    <div className="flex h-screen">

      {/* SIDEBAR */}
      <div className="w-60 bg-gray-100 p-4">
        {Object.keys(grouped).map((k) => (
          <div
            key={k}
            onClick={() => {
              setSelected(k);
              setOpen(false);
            }}
            className="p-2 cursor-pointer hover:bg-gray-200"
          >
            {k}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-5">

        {selected && (
          <>
            {/* CARD */}
            <div
              className="border p-4 flex justify-between cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <div>
                {selected} Unique (
                {new Set(articles.map((a) => a.title)).size})
                Total ({articles.length})
              </div>
              <div>{open ? "⌄" : ">"}</div>
            </div>

            {/* EXPAND */}
            {open &&
              articles.map((a, i) => (
                <div key={i} className="border p-3 mt-2">
                  <p className="font-semibold text-blue-600">
                    {a.title}
                  </p>
                  <p className="text-xs">{a.source}</p>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}