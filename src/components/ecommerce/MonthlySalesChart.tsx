"use client";

import { useEffect, useState } from "react";

export default function MonthlySalesChart() {

  const [keywords, setKeywords] = useState([
    // "ICICI Securities",
    // "Geojit Financial",
    "Kotak Securities"
  ]);

  const [news, setNews] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);


  useEffect(() => {

    const query = keywords.join(",");

    setNews([]); // reset old data

    fetch(
      `/api/opoint-news?keywords=${encodeURIComponent(query)}`,
      { cache: "no-store" }
    )
      .then(res => res.json())
      .then(data => {

        console.log("TWINGLY", data);

        setNews(data.articles || []);

      });

  }, [keywords]); // ✅ important


  const getNewsByKeyword = (keyword: string) => {

    if (keywords.length === 1) return news;

    const words = keyword.toLowerCase().split(" ");

    return news.filter(n => {

      const text =
        (n.title || "") +
        " " +
        (n.text || "");

      return words.some(w =>
        text.toLowerCase().includes(w)
      );

    });

  };


  return (

    <div className="rounded-2xl border bg-white p-5 space-y-4">

      <h2 className="text-lg font-bold">
        Stock News (Twingly)
      </h2>


      {keywords.map(keyword => {

        const list = getNewsByKeyword(keyword);

        return (

          <div key={keyword} className="border rounded-lg">

            <div
              onClick={() =>
                setOpen(
                  open === keyword
                    ? null
                    : keyword
                )
              }
              className="cursor-pointer bg-gray-100 px-4 py-3 font-semibold flex justify-between"
            >
              {keyword}
              <span>
                {open === keyword ? "−" : "+"}
              </span>
            </div>


            {open === keyword && (

              <div className="p-4 space-y-4">

                {list.length === 0 && (
                  <p>No news found</p>
                )}

                {list.map((n, i) => (

                  <div
                    key={i}
                    className="border rounded-lg p-3 space-y-2"
                  >

                    <h3 className="text-blue-600 font-semibold">
                      {n.title}
                    </h3>

                    <p>
                      {n.text?.slice(0, 150)}
                    </p>

                    <p className="text-xs">
                      Author: {n.author}
                    </p>

                    <p className="text-xs">
                      Date:
                      {n.timestamp &&
                        new Date(
                          n.timestamp
                        ).toLocaleString()}
                    </p>

                    <a
                      href={n.url}
                      target="_blank"
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Read Full Article
                    </a>

                  </div>

                ))}

              </div>

            )}

          </div>

        );

      })}

    </div>

  );
}