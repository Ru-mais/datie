import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Check for a cron secret if you want to secure the endpoint from arbitrary calls
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    // Touch a keep-alive document to keep the database active
    const keepAliveDocRef = doc(db, "system", "keep-alive");
    await setDoc(keepAliveDocRef, {
      lastPing: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true, message: "Database keep-alive ping successful." });
  } catch (error: any) {
    console.error("Keep-Alive Endpoint Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
