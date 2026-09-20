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

    console.log(`Starting Total Purge for user: ${uid}`);

    // 1. Fetch user doc to read their phone and email
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : null;

    // 2. Delete used_phones reservation so the phone number is released
    if (userData?.phone) {
      try {
        await deleteDoc(doc(db, "used_phones", userData.phone));
      } catch (e) {
        console.warn("Failed to delete used_phones doc:", e);
      }
    }

    // 3. Delete MATCHES and all subcollection messages
    const matchesRef = collection(db, "matches");
    const matchesQuery = query(matchesRef, where("users", "array-contains", uid));
    const matchSnap = await getDocs(matchesQuery);
    
    for (const matchDoc of matchSnap.docs) {
       const messagesRef = collection(db, "matches", matchDoc.id, "messages");
       const msgSnap = await getDocs(messagesRef);
       if (!msgSnap.empty) {
         const batch = writeBatch(db);
         msgSnap.docs.forEach((msg) => batch.delete(msg.ref));
         await batch.commit();
       }
       await deleteDoc(matchDoc.ref);
    }

    // 4. Delete CHATS and all subcollection messages
    const chatsRef = collection(db, "chats");
    const chatsQuery = query(chatsRef, where("participants", "array-contains", uid));
    const chatSnap = await getDocs(chatsQuery);
    
    for (const chatDoc of chatSnap.docs) {
       const messagesRef = collection(db, "chats", chatDoc.id, "messages");
       const msgSnap = await getDocs(messagesRef);
       if (!msgSnap.empty) {
         const batch = writeBatch(db);
         msgSnap.docs.forEach((msg) => batch.delete(msg.ref));
         await batch.commit();
       }
       await deleteDoc(chatDoc.ref);
    }

    // 5. Delete LIKES (Sent or Received)
    const likesRef = collection(db, "likes");
    const sentLikes = await getDocs(query(likesRef, where("from", "==", uid)));
    const receivedLikes = await getDocs(query(likesRef, where("to", "==", uid)));
    
    const likesBatch = writeBatch(db);
    sentLikes.docs.forEach(d => likesBatch.delete(d.ref));
    receivedLikes.docs.forEach(d => likesBatch.delete(d.ref));
    await likesBatch.commit();

    // 6. Delete BLOCKS (Sent or Received)
    const blocksRef = collection(db, "blocks");
    const sentBlocks = await getDocs(query(blocksRef, where("blocker", "==", uid)));
    const receivedBlocks = await getDocs(query(blocksRef, where("blocked", "==", uid)));
    
    const blocksBatch = writeBatch(db);
    sentBlocks.docs.forEach(d => blocksBatch.delete(d.ref));
    receivedBlocks.docs.forEach(d => blocksBatch.delete(d.ref));
    await blocksBatch.commit();

    // 7. Delete DELETION_REQUESTS for this user
    const delReqs = await getDocs(query(collection(db, "deletion_requests"), where("uid", "==", uid)));
    const delBatch = writeBatch(db);
    delReqs.docs.forEach(d => delBatch.delete(d.ref));
    await delBatch.commit();

    // 8. Delete REPORTS involving this user
    const reportsTarget = await getDocs(query(collection(db, "reports"), where("reportedId", "==", uid)));
    const repBatch = writeBatch(db);
    reportsTarget.docs.forEach(d => repBatch.delete(d.ref));
    await repBatch.commit();

    // 9. Delete legacy users_auth if present
    if (userData?.email) {
      try {
        await deleteDoc(doc(db, "users_auth", userData.email.toLowerCase().trim()));
      } catch {}
    }

    // 10. Delete the USER Profile
    await deleteDoc(userDocRef);

    return NextResponse.json({ 
      success: true, 
      message: `User ${uid} and all associated records (matches, messages, likes, blocks, phone reservation) have been permanently wiped from Firestore.` 
    });

  } catch (error: any) {
    console.error("Cleanup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
