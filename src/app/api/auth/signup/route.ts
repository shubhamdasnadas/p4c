import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
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

function generatePassword() {
    return crypto.randomBytes(6).toString("hex"); // 12 chars
}

export async function POST(req: Request) {
    const { fname, lname, email } = await req.json();

    if (!fname || !lname || !email) {
        return NextResponse.json(
            { message: "All fields are required" },
            { status: 400 }
        );
    }

    // ✅ Ensure table exists
    await pool.query(CREATE_TABLE_QUERY);

    // ✅ Check existing user
    const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
    );

    if (existing.rowCount && existing.rowCount > 0) {
        return NextResponse.json(
            { message: "User already exists. Please sign in." },
            { status: 409 }
        );
    }

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await pool.query(
        `INSERT INTO users (first_name, last_name, email, password)
     VALUES ($1, $2, $3, $4)`,
        [fname, lname, email, hashedPassword]
    );

    // later: email this password
    console.log("Generated password:", plainPassword);

    return NextResponse.json({ success: true });
}
