import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, writeBatch } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { adminSecret } = await req.json();

    // Security Check: Match the server-side admin key
    if (adminSecret !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const collectionsToClear = ["users", "likes", "blocks", "deletion_requests", "users_auth"];
    let deletedCount = 0;

    // 1. Clear simple collections
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      if (snap.size > 0) {
        const batch = writeBatch(db);
        snap.docs.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        await batch.commit();
      }
    }

    // 2. Clear matches and nested messages
    const matchesSnap = await getDocs(collection(db, "matches"));
    for (const matchDoc of matchesSnap.docs) {
      // Clear messages subcollection
      const messagesRef = collection(db, "matches", matchDoc.id, "messages");
      const msgSnap = await getDocs(messagesRef);
      if (msgSnap.size > 0) {
        const batch = writeBatch(db);
        msgSnap.docs.forEach(msg => {
          batch.delete(msg.ref);
          deletedCount++;
        });
        await batch.commit();
      }
      // Delete match doc
      await deleteDoc(matchDoc.ref);
      deletedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Database completely cleared. Deleted ${deletedCount} documents.`
    });
  } catch (error: any) {
    console.error("Clear All DB Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
