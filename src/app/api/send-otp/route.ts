import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

    const uri = process.env.MONGODB_URI!;
    const client = new MongoClient(uri);

    try {

        const { mobile } = await req.json();

        await client.connect();

        const db = client.db("my_database");
        const users = db.collection("users");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await users.updateOne(
            { mobile },
            {
                $set: {
                    mobile,
                    otp,
                    otpExpiry: new Date(Date.now() + 5 * 60 * 1000)
                }
            },
            { upsert: true }
        );

        // FAST2SMS API
        const params = new URLSearchParams({
            sender_id: "FSTSMS",
            message: `Your OTP is ${otp}`,
            language: "english",
            route: "p",
            numbers: mobile
        });

        const response = await fetch("https://www.fast2sms.com/dev/bulk", {
            method: "POST",
            headers: {
                authorization: process.env.FAST2SMS_API_KEY!,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
        });


        const data = await response.json();

        return NextResponse.json({
            success: true,
            message: "OTP sent via Fast2SMS",
            fast2sms: data
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