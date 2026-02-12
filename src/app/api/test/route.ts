import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST() {
    // Add the '!' assertion at the end to satisfy TypeScript
    const uri = process.env.MONGODB_URI!; 

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("my_database");
        const collection = db.collection("list");

        const result = await collection.insertOne({
            message: "Hello ",
            timestamp: new Date()
        });

        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    } finally {
        await client.close();
    }
}