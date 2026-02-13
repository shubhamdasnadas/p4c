import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

    const user = await users.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // ✅ GENERATE JWT TOKEN (USE ENV SECRET)
    const payload = {
      sub: user._id.toString(),
      username: user.username,
    };

    const token = jwt.sign(payload, "secret", {
      expiresIn: "7d",
    });

    return NextResponse.json({
      success: true,
      token,          // ✅ Full valid JWT
      user: payload,  // ✅ Decoded data for frontend
      message: "Login successful",
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
