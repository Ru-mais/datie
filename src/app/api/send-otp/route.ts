import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    // Fast2SMS API Configuration (Highly reliable for India, offers free testing credits)
    const API_KEY = process.env.FAST2SMS_API_KEY;
    
    if (!API_KEY || API_KEY === "your_fast2sms_api_key_here") {
      return NextResponse.json({ error: "SMS Gateway API Key not configured" }, { status: 500 });
    }

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone number and code are required" }, { status: 400 });
    }

    // Format phone: remove +91 if present for Fast2SMS compatibility
    const formattedPhone = phone.replace(/^\+91/, "");

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "v3",
        sender_id: "TXTIND",
        message: `Your Datie. verification code is ${code}. Do not share this with anyone.`,
        language: "english",
        flash: 0,
        numbers: formattedPhone
      })
    });

    const data = await response.json();

    if (data.return) {
      return NextResponse.json({ success: true, message: "OTP Sent successfully" });
    } else {
      return NextResponse.json({ error: data.message || "Failed to send SMS via Gateway" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("SMS Gateway Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
