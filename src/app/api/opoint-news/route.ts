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

// ✅ SAFE TEXT
function getText(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") return field.text || "";
  return "";
}

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

// ─── Generate combinations ─────────────────────────────────
function getCombinations(arr: string[], size: number) {
  const result: string[][] = [];

  function helper(start: number, combo: string[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }

  helper(0, []);
  return result;
}

// ─── API Route Handler ─────────────────────────────────────
export async function GET() {
  try {
    const keywords = [
      "ICICI Securities",
      "Geojit",
      "जियोजित",
      "Kotak Securities",
      "Motilal Oswal Group",
      "Finance",
      "Angel One",
      "IPO",
      "Zerodha"
    ];

    // ✅ ALL combinations
    const single = keywords.map((k) => [k]);
    const pairs = getCombinations(keywords, 2);
    const triples = getCombinations(keywords, 3);

    const allGroups = [...single, ...pairs, ...triples];

    // ✅ PARALLEL CALLS ⚡
    const promises = allGroups.map(async (group) => {
      const query = group
        .map((k) => (k.includes(" ") ? `"${k}"` : k))
        .join(" AND ");

      const payload = {
        searchterm: query,
        params: {
          requestedarticles: 5000,
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

      const data = await response.json();
      const documents = data?.searchresult?.document || [];

      const todayDocs = filterTodayIST(documents);

      const formatted = todayDocs.map((doc: any) => ({
        title:
          getText(doc?.linkheader) ||
          getText(doc?.header) ||
          "No title",

        summary:
          getText(doc?.linksummary) ||
          getText(doc?.summary) ||
          "",

        body:
          getText(doc?.linkbody) ||
          getText(doc?.body) ||
          "",

        source: doc?.first_source?.name || "Unknown",

        published_at: doc?.unix_timestamp
          ? doc.unix_timestamp * 1000
          : null,

        url: doc?.url,

        image_url:
          doc?.articleimages?.articleimage?.[0]?.url || "",

        matches: doc?.linkmatches || [],

        article_details: {
          entity: getText(doc?.entity) || "N/A",
          website:
            doc?.first_source?.homepage ||
            doc?.source?.homepage ||
            "N/A",
          author: getText(doc?.author) || "N/A",
          word_count:
            doc?.wordcount || doc?.word_count || "N/A",
          publish_date: doc?.local_time?.text || "N/A",
          monthly_visitors: doc?.circulation || "N/A",
          country_rank:
            doc?.site_rank?.rank_country || "N/A",
          global_rank:
            doc?.site_rank?.rank_global || "N/A",
          genre: getText(doc?.mediatype?.text) || "N/A",
          country: doc?.countryname || "N/A",
          language: getText(doc?.language) || "N/A",
        },
      }));

      const unique = Array.from(
        new Map(formatted.map((item) => [item.title, item])).values()
      );

      return {
        key: group.join(" + "),
        data: unique,
      };
    });

    const results = await Promise.all(promises);

    // ✅ FINAL GROUP FORMAT (IMPORTANT FOR UI)
    const grouped: any = {};
    results.forEach((r) => {
      grouped[r.key] = r.data;
    });

    return NextResponse.json({
      groups: grouped,
      totalGroups: results.length,
      keywordsUsed: keywords,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}