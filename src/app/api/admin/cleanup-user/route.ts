import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, writeBatch } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { uid, adminSecret } = await req.json();

    // Security Check: Match the server-side admin key
    if (adminSecret !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    console.log(`Starting Cascading Deletion for user: ${uid}`);

    // 1. Delete all MATCHES (and their nested messages)
    const matchesRef = collection(db, "matches");
    const matchesQuery = query(matchesRef, where("users", "array-contains", uid));
    const matchSnap = await getDocs(matchesQuery);
    
    for (const matchDoc of matchSnap.docs) {
       // Delete nested messages first
       const messagesRef = collection(db, "matches", matchDoc.id, "messages");
       const msgSnap = await getDocs(messagesRef);
       const batch = writeBatch(db);
       msgSnap.docs.forEach((msg) => batch.delete(msg.ref));
       await batch.commit();
       
       // Delete the match itself
       await deleteDoc(matchDoc.ref);
    }

    // 2. Delete LIKES (Sent or Received)
    const likesRef = collection(db, "likes");
    const sentLikesQuery = query(likesRef, where("from", "==", uid));
    const receivedLikesQuery = query(likesRef, where("to", "==", uid));
    
    const sentLikes = await getDocs(sentLikesQuery);
    const receivedLikes = await getDocs(receivedLikesQuery);
    
    const likesBatch = writeBatch(db);
    sentLikes.docs.forEach(d => likesBatch.delete(d.ref));
    receivedLikes.docs.forEach(d => likesBatch.delete(d.ref));
    await likesBatch.commit();

    // 3. Delete BLOCKS (Sent or Received)
    const blocksRef = collection(db, "blocks");
    const sentBlocks = await getDocs(query(blocksRef, where("blocker", "==", uid)));
    const receivedBlocks = await getDocs(query(blocksRef, where("blocked", "==", uid)));
    
    const blocksBatch = writeBatch(db);
    sentBlocks.docs.forEach(d => blocksBatch.delete(d.ref));
    receivedBlocks.docs.forEach(d => blocksBatch.delete(d.ref));
    await blocksBatch.commit();

    // 4. Get USER email first to purge their credentials
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.email) {
        const authDocRef = doc(db, "users_auth", userData.email.toLowerCase().trim());
        await deleteDoc(authDocRef);
      }
    }

    // 5. Delete the USER Profile
    await deleteDoc(userDocRef);

    return NextResponse.json({ 
      success: true, 
      message: `User ${uid} and all related data (matches, messages, likes) have been permanently purged.` 
    });

  } catch (error: any) {
    console.error("Cleanup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
