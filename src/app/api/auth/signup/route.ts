import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password required" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("my_database");
    const users = db.collection("users");

    // Check existing user
    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 400 }
      );
    }

    await users.insertOne({
      username,
      password,           // ⚠ plain text (not secure, but per your request)
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
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
