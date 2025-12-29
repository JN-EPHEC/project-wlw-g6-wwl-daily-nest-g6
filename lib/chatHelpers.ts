// lib/chatHelpers.ts
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export function makeDmChatId(uidA: string, uidB: string) {
  return uidA < uidB ? `dm_${uidA}_${uidB}` : `dm_${uidB}_${uidA}`;
}

// create conversation doc under families/{familyId}/conversations or under a user's list
export async function createConversation(familyId: string, data: { type: "group" | "private"; members: string[]; title?: string }) {
  // conversations collection at dd/families/{familyId}/conversations
  const convRef = collection(db, "dd", "families", familyId, "conversations");
  const docRef = await addDoc(convRef, {
    ...data,
    lastMessage: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function sendMessageToConversation(familyId: string, conversationId: string, text: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged");
  const messagesCol = collection(db, "dd", "families", familyId, "conversations", conversationId, "messages");
  await addDoc(messagesCol, {
    text,
    senderId: user.uid,
    senderEmail: user.email || null,
    createdAt: serverTimestamp(),
    edited: false,
    pinned: false,
    reactions: {},
  });
  // update lastMessage
  await setDoc(doc(db, "dd", "families", familyId, "conversations", conversationId), {
    lastMessage: text,
    lastUpdated: serverTimestamp(),
  }, { merge: true });
}

export function listenConversationMessages(familyId: string, conversationId: string, cb: (docs: any[]) => void) {
  const q = query(collection(db, "dd", "families", familyId, "conversations", conversationId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    cb(arr);
  });
}

// private chats: under dd/privateChats/{chatId}/messages
export async function sendPrivateMessage(receiverUid: string, text: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged");
  const chatId = makeDmChatId(user.uid, receiverUid);
  const msgs = collection(db, "dd", "privateChats", chatId, "messages");
  await addDoc(msgs, {
    text,
    senderId: user.uid,
    receiverId: receiverUid,
    createdAt: serverTimestamp(),
    edited: false,
    reactions: {},
  });
}

export function listenPrivateMessages(chatId: string, cb: (docs: any[]) => void) {
  const q = query(collection(db, "dd", "privateChats", chatId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
}
