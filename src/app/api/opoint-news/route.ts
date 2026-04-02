import { NextResponse } from "next/server";

// ─── Configuration ─────────────────────────────────────────
const API_TOKEN = "070e1d57bb0817a34d5d62a4c58a20eee85a3a30";
const BASE_URL = "https://api.opoint.com/search/";

const HEADERS = {
  Authorization: `Token ${API_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ─── IST Timezone Helper ───────────────────────────────────
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function getTodayISTDate(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET);
  return istTime.toISOString().split("T")[0];
}

// ─── Filter Today's Articles ───────────────────────────────
function filterTodayIST(documents: any[]) {
  const todayIST = getTodayISTDate();

  return documents.filter((doc) => {
    if (!doc.unix_timestamp) return false;

    const dateIST = new Date(
      doc.unix_timestamp * 1000 + IST_OFFSET
    )
      .toISOString()
      .split("T")[0];

    return dateIST === todayIST;
  });
}

// ─── Build Search Query (MULTI KEYWORD) ─────────────────────
// Supports both combinations and permutations (AND groups joined by OR).
function buildSearchQuery(keywords: string[]) {
  const normalize = (k: string) =>
    k.includes(" ") ? `"${k}"` : k;

  const uniqueClauses = new Set<string>();
  const n = keywords.length;

  const permute = (arr: string[]): string[][] => {
    if (arr.length <= 1) return [arr];

    const permutations: string[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];

      for (const sub of permute(rest)) {
        permutations.push([current, ...sub]);
      }
    }

    return permutations;
  };

  // Build all non-empty combinations, then all permutations within each combination.
  for (let mask = 1; mask < (1 << n); mask++) {
    const combo: string[] = [];

    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        combo.push(normalize(keywords[i]));
      }
    }

    if (combo.length === 1) {
      uniqueClauses.add(`(${combo[0]})`);
      continue;
    }

    for (const order of permute(combo)) {
      uniqueClauses.add(`(${order.join(" AND ")})`);
    }
  }

  return Array.from(uniqueClauses).join(" OR ");
}

// ─── API Route Handler ─────────────────────────────────────
export async function GET(request: Request) {
  try {
    // 🔥 Get keywords from query params or use defaults
    const { searchParams } = new URL(request.url);
    const keywordParam = searchParams.get("keywords");
    
    // Default keywords for fallback
    const defaultKeywords = [
      "ICICI Securities",
      "Motilal Oswal Group",
      "Groww",
      // "India Infoline Finance",
      // "Banking"      
      // "Geojit",
      // "जियोजित"
    ];
    
    const keywords = keywordParam 
      ? keywordParam.split(",").map(k => k.trim()).filter(k => k.length > 0)
      : defaultKeywords;

    // 🟢 build query
    const searchQuery = buildSearchQuery(keywords);

    // 🟢 DEBUG (safe place)
    console.log("\n=== GENERATED QUERY ===");
    console.log(searchQuery);
    console.log("QUERY LENGTH:", searchQuery.length);
    console.log("=======================\n");
    const payload = {
      searchterm: searchQuery,

      params: {
        requestedarticles: 500,

        main: {
          header: 2,
          summary: 2,
          text: 2,
          quotes: 1,
        },
      },
    };

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const data = await response.json();
    const documents = data?.searchresult?.document || [];

    const todayDocs = filterTodayIST(documents);

    // 🔥 Transform response for frontend
    const formatted = todayDocs.map((doc: any) => ({
      title:
        doc?.linkheader?.text ||
        doc?.header?.text ||
        "No title",

      summary:
        doc?.linksummary?.text ||
        doc?.summary?.text ||
        "",

      body:
        doc?.linkbody?.text ||
        doc?.body?.text ||
        "",

      source: doc?.first_source?.name || "Unknown",

      published_at: doc?.unix_timestamp
        ? doc.unix_timestamp * 1000
        : null,

      url: doc?.url,

      image_url:
        doc?.articleimages?.articleimage?.[0]?.url || "",

      matches: doc?.linkmatches || [],
    }));

    // ✅ Remove duplicates (by title)
    const unique = Array.from(
      new Map(formatted.map((item) => [item.title, item])).values()
    );

    return NextResponse.json({
      total: documents.length,
      todayCount: unique.length,
      articles: unique,
      keywordsUsed: keywords,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}