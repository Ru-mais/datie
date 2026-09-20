import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, writeBatch } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid, adminSecret } = body;

    // Security Check: Match the server-side admin key
    if (!adminSecret || adminSecret !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid administrative secret." }, { status: 403 });
    }

    if (!uid) {
      return NextResponse.json({ error: "UID is required for deletion." }, { status: 400 });
    }

    console.log(`[Admin Cleanup] Initiating total purge for UID: ${uid}`);

    // 1. Fetch user profile data first
    let userPhone: string | null = null;
    let userEmail: string | null = null;
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const d = userDocSnap.data();
        userPhone = d.phone || null;
        userEmail = d.email || null;
      }
    } catch (e) {
      console.warn("[Admin Cleanup] Could not read user doc:", e);
    }

    // 2. Delete used_phones document if phone exists
    if (userPhone) {
      try {
        await deleteDoc(doc(db, "used_phones", userPhone));
        console.log(`[Admin Cleanup] Released used_phones: ${userPhone}`);
      } catch (e) {
        console.warn("[Admin Cleanup] Failed to delete used_phones:", e);
      }
    }

    // 3. Delete from matches (and subcollection messages)
    try {
      const matchesQuery = query(collection(db, "matches"), where("users", "array-contains", uid));
      const matchSnap = await getDocs(matchesQuery);
      for (const matchDoc of matchSnap.docs) {
        try {
          const msgSnap = await getDocs(collection(db, "matches", matchDoc.id, "messages"));
          if (!msgSnap.empty) {
            const b = writeBatch(db);
            msgSnap.docs.forEach(m => b.delete(m.ref));
            await b.commit();
          }
        } catch {}
        await deleteDoc(matchDoc.ref);
      }
      console.log(`[Admin Cleanup] Purged ${matchSnap.size} matches`);
    } catch (e) {
      console.warn("[Admin Cleanup] Failed cleaning matches:", e);
    }

    // 4. Delete from chats (and subcollection messages)
    try {
      const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", uid));
      const chatSnap = await getDocs(chatsQuery);
      for (const chatDoc of chatSnap.docs) {
        try {
          const msgSnap = await getDocs(collection(db, "chats", chatDoc.id, "messages"));
          if (!msgSnap.empty) {
            const b = writeBatch(db);
            msgSnap.docs.forEach(m => b.delete(m.ref));
            await b.commit();
          }
        } catch {}
        await deleteDoc(chatDoc.ref);
      }
    } catch (e) {
      console.warn("[Admin Cleanup] Failed cleaning chats:", e);
    }

    // 5. Delete likes (sent & received)
    try {
      const sentLikes = await getDocs(query(collection(db, "likes"), where("from", "==", uid)));
      const recvLikes = await getDocs(query(collection(db, "likes"), where("to", "==", uid)));
      const batch = writeBatch(db);
      sentLikes.docs.forEach(d => batch.delete(d.ref));
      recvLikes.docs.forEach(d => batch.delete(d.ref));
      if (sentLikes.size > 0 || recvLikes.size > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn("[Admin Cleanup] Failed cleaning likes:", e);
    }

    // 6. Delete blocks (sent & received)
    try {
      const sentBlocks = await getDocs(query(collection(db, "blocks"), where("blocker", "==", uid)));
      const recvBlocks = await getDocs(query(collection(db, "blocks"), where("blocked", "==", uid)));
      const batch = writeBatch(db);
      sentBlocks.docs.forEach(d => batch.delete(d.ref));
      recvBlocks.docs.forEach(d => batch.delete(d.ref));
      if (sentBlocks.size > 0 || recvBlocks.size > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn("[Admin Cleanup] Failed cleaning blocks:", e);
    }

    // 7. Delete deletion_requests
    try {
      const delReqs = await getDocs(query(collection(db, "deletion_requests"), where("uid", "==", uid)));
      if (!delReqs.empty) {
        const batch = writeBatch(db);
        delReqs.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn("[Admin Cleanup] Failed cleaning deletion_requests:", e);
    }

    // 8. Delete reports
    try {
      const reps = await getDocs(query(collection(db, "reports"), where("reportedId", "==", uid)));
      if (!reps.empty) {
        const batch = writeBatch(db);
        reps.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn("[Admin Cleanup] Failed cleaning reports:", e);
    }

    // 9. Delete legacy users_auth
    if (userEmail) {
      try {
        await deleteDoc(doc(db, "users_auth", userEmail.toLowerCase().trim()));
      } catch {}
    }

    // 10. Delete the user profile document
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (e: any) {
      console.error("[Admin Cleanup] Failed to delete user profile doc:", e);
      return NextResponse.json({ error: `Failed to delete user profile doc: ${e.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${uid} and all associated data have been permanently wiped.`
    });

  } catch (error: any) {
    console.error("[Admin Cleanup Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
