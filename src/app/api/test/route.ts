import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        return NextResponse.json({ error: "Database URI not configured" }, { status: 500 });
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("my_database");
        const collection = db.collection("recorddata");

        const result = await collection.insertOne({
            message: "Hello from Next.js",
            timestamp: new Date()
        });

        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    } finally {
        await client.close();
    }
}