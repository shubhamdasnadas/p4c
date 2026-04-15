import { NextResponse } from "next/server";

// ─── CONFIG ─────────────────────────────────────────
const API_TOKEN = process.env.OPOINT_API_TOKEN!;
const BASE_URL = "https://api.opoint.com/search/";

const HEADERS = {
    Authorization: `Token ${API_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
};

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

// 🟢 KEYWORD MAP (MERGE LOGIC)
const KEYWORD_MAP: Record<string, string[]> = {
    //   Geojit: ["जियोजित"], // 👈 Hindi hidden internally
    "Motilal Oswal": ["मोतीलाल ओसवाल"],
};

// ─── HELPERS ─────────────────────────────────────────
function getText(field: any): string {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (typeof field === "object") return field.text || "";
    return "";
}

function cleanHTML(text: string) {
    return text?.replace(/<[^>]+>/g, "") || "";
}

function extractKeywords(text: string) {
    if (!text) return [];
    return [...text.matchAll(/<match[^>]*>(.*?)<\/match>/g)].map(
        (m) => m[1]
    );
}

function getTodayISTDate(): string {
    const now = new Date();
    const ist = new Date(now.getTime() + IST_OFFSET);
    return ist.toISOString().split("T")[0];
}

function filterTodayIST(documents: any[]) {
    const todayIST = getTodayISTDate();

    return documents.filter((doc) => {
        const ts = doc?.unix_timestamp;
        if (!ts) return false;

        const date = new Date(ts * 1000 + IST_OFFSET)
            .toISOString()
            .split("T")[0];

        return date === todayIST;
    });
}

// 🟢 BUILD QUERY (MERGED)
function buildSearchQuery(keyword: string) {
    const variations = [keyword];

    if (KEYWORD_MAP[keyword]) {
        variations.push(...KEYWORD_MAP[keyword]);
    }

    return `(${variations.join(" OR ")})`;
}

// ─── API ─────────────────────────────────────────
export async function GET() {
    try {
        const userKeyword = "Motilal Oswal";

        const payload = {
            searchterm: buildSearchQuery(userKeyword),
            params: {
                requestedarticles: 1000,
                main: {
                    header: 2,
                    summary: 2,
                    text: 2,
                    quotes: 1,
                },
                highlight: true,
            },
        };

        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("API failed");
        }

        const data = await response.json();
        const docs = data?.searchresult?.document || [];

        const todayDocs = filterTodayIST(docs);

        const articles = todayDocs.map((doc: any, index: number) => {
            const header = getText(doc?.header);
            const summary = getText(doc?.summary);
            const body = getText(doc?.body);

            let keywords = [
                ...extractKeywords(header),
                ...extractKeywords(summary),
                ...extractKeywords(body),
            ];

            // 🔥 IMPORTANT: Normalize Hindi → English
            keywords = keywords.map((k) => {
                if (k === "मोतीलाल ओसवाल") return "Motilal Oswal Group";
                return k;
            });

            return {
                id: index + 1,
                title: cleanHTML(header),
                summary: cleanHTML(summary),
                body: cleanHTML(body),
                url: doc?.url,
                source: doc?.first_source?.name || "N/A",
                published_at: doc?.unix_timestamp
                    ? doc.unix_timestamp * 1000
                    : null,
                image_url:
                    doc?.articleimages?.articleimage?.[0]?.url || "",

                // ✅ ONLY ENGLISH KEYWORD SHOWN
                matched_keywords: [...new Set(keywords)],

                article_details: {
                    entity: getText(doc?.entity),
                    website: doc?.first_source?.homepage || "N/A",
                    author: getText(doc?.author),
                    word_count: doc?.wordcount || "N/A",
                    publish_date: doc?.local_time?.text || "N/A",
                    monthly_visitors: doc?.circulation || "N/A",
                    country_rank: doc?.site_rank?.rank_country || "N/A",
                    global_rank: doc?.site_rank?.rank_global || "N/A",
                    genre: getText(doc?.mediatype),
                    country: doc?.countryname || "N/A",
                    language: getText(doc?.language),
                },
            };
        });

        return NextResponse.json({
            total: articles.length,
            date: getTodayISTDate(),
            articles,
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}