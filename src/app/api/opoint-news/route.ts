export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function toISO(date: Date) {
  return date.toISOString().split(".")[0] + "Z";
}

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url);

    const keywordsParam =
      searchParams.get("keywords") ||
      "ICICI Securities";

    const keywords = keywordsParam
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);


    // ===== UNIQUE =====

    const unique = [...new Set(keywords)];


    // ===== TODAY ONLY =====

    const now = new Date();

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0); // start of today UTC

    const sinceISO = toISO(todayStart);
    const untilISO = toISO(now);


    // ===== BODY =====

    const body = {

      any: unique,

      size: 20,

      sort: "timestamp",

      order: "desc",

      timestamp: {
        since: sinceISO,
        until: untilISO,
      },

    };


    const url =
      "https://data.twingly.net/news/b/search/v1/search";


    const res = await fetch(url, {

      method: "POST",

      headers: {
        Authorization:
          `apikey ${process.env.TWINGLY_API_KEY}`,
        "Content-Type":
          "application/json; charset=utf-8",
        Accept:
          "application/json; charset=utf-8",
      },

      body: JSON.stringify(body),

      cache: "no-store",
    });


    const data = await res.json();

    console.log("TWINGLY", data);


    const articles =
      data?.documents || [];


    return NextResponse.json({
      articles,
    });

  } catch (err) {

    return NextResponse.json({
      articles: [],
      error: String(err),
    });

  }
}