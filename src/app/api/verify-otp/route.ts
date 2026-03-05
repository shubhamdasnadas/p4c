import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {

    const { mobile, otp } = await req.json();

    await client.connect();

    const db = client.db("my_database");
    const users = db.collection("users");

    const user = await users.findOne({ mobile });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      });
    }

    if (user.otp !== otp) {
      return NextResponse.json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (new Date(user.otpExpiry) < new Date()) {
      return NextResponse.json({
        success: false,
        message: "OTP expired"
      });
    }

    await users.updateOne(
      { mobile },
      { $unset: { otp: "", otpExpiry: "" } }
    );

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (error: any) {

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );

  } finally {
    await client.close();
  }
}