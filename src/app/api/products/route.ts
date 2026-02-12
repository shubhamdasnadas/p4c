import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const uri = process.env.MONGODB_URI!;
    const client = new MongoClient(uri);

    try {
        // Parse the body from the frontend request
        const body = await request.json();
        const { name, price } = body;

        // Basic validation
        if (!name || typeof price !== 'number') {
            return NextResponse.json(
                { success: false, error: "Invalid name or price" },
                { status: 400 }
            );
        }

        await client.connect();
        const db = client.db("my_database");
        
        // This automatically creates the 'products' collection if it doesn't exist
        const collection = db.collection("products");

        const result = await collection.insertOne({
            name,
            price,
            createdAt: new Date()
        });

        return NextResponse.json({ 
            success: true, 
            message: "Product added!", 
            productId: result.insertedId 
        });

    } catch (e: any) {
        return NextResponse.json(
            { success: false, error: e.message }, 
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}