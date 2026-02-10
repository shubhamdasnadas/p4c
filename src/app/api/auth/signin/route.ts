import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

const CREATE_TABLE_QUERY = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

export async function POST(req: Request) {
    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json(
            { message: "Email and password required" },
            { status: 400 }
        );
    }

    // ✅ Ensure table exists
    await pool.query(CREATE_TABLE_QUERY);

    const result = await pool.query(
        "SELECT password FROM users WHERE email = $1",
        [email]
    );

    if (result.rowCount === 0) {
        return NextResponse.json(
            { message: "User not found. Please sign up." },
            { status: 404 }
        );
    }

    const valid = await bcrypt.compare(
        password,
        result.rows[0].password
    );

    if (!valid) {
        return NextResponse.json(
            { message: "Invalid password" },
            { status: 401 }
        );
    }

    return NextResponse.json({ success: true });
}
