import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    // Textbee.dev API Configuration (Free Android SMS Gateway)
    const API_KEY = process.env.TEXTBEE_API_KEY;
    const DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;
    
    if (!API_KEY || !DEVICE_ID || API_KEY === "your_textbee_api_key_here") {
      return NextResponse.json({ error: "Textbee Gateway not configured" }, { status: 500 });
    }

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone number and code are required" }, { status: 400 });
    }

    // Format phone: ensure it has a country code (defaults to +91 if missing)
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    const response = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/send-sms`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        message: `Your Datie. verification code is ${code}. Do not share this with anyone.`
      })
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: "OTP Sent successfully via Textbee" });
    } else {
      const data = await response.json();
      return NextResponse.json({ error: data.message || "Failed to send SMS via Textbee" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Textbee Gateway Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
