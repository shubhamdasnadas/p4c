import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import zlib from "zlib";

const MONGO_URI = "mongodb://localhost:27017/my_python?tls=false";

export async function GET() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const db = client.db("my_python");
    const collection = db.collection("opoint_articles");

    const doc = await collection.findOne({}, { sort: { _id: -1 } });

    if (!doc) {
      return NextResponse.json({ articles: [] });
    }

    let articles: any[] = [];

    // ✅ CASE 1: Normal array (YOUR CURRENT DB)
    if (doc.articles && Array.isArray(doc.articles)) {
      articles = doc.articles;
    }

    // ✅ CASE 2: Compressed (old logic)
    else if (doc.articles_compressed) {
      const buffer = Buffer.from(doc.articles_compressed.buffer);
      const decompressed = zlib.gunzipSync(buffer).toString("utf-8");
      articles = JSON.parse(decompressed);
    }

    return NextResponse.json({
      total: doc.total,
      date: doc.date,
      context: doc.context,
      keyword_counts: doc.keyword_counts,
      articles,
      bag_of_words: doc.bag_of_words
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  } finally {
    await client.close();
  }
}