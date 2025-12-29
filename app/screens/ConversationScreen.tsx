import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { addDoc, collection, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView, Platform,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebaseConfig";

import { doc, getDocs, updateDoc, where } from "firebase/firestore";

type Message = {
  id: string;
  text: string;
  sender: string;
  status: "sending" | "sent" | "read" | "error";
  createdAt: any;
};

export default function ConversationScreen() {
  const route = useRoute();
    const { conversationId } = route.params as {
    conversationId: string;
  };

    const currentUser = auth.currentUser;

  if (!currentUser || !currentUser.email) {
    return <Text>Chargement...</Text>;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);



  //Récupérer messages en temps réel
  useEffect(() => {
    const q = query(collection(db, "conversations", conversationId, "messages"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(msgs.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds));
    });
     markAsRead();

    return () => unsub();
  }, [conversationId]);
  

  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {  
      sendMessage();
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [message]);

  //Scroll auto
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // 🔹 Envoyer message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) return;
  
    const tempId = Date.now().toString();
    const msgToSend = message;
    setMessage("");

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: message,
        sender:currentUser.email!,
        status: "sending",
        createdAt: new Date(),
        avatar: currentUser.photoURL || null,
      },
    ]);

    
   try {
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        text: msgToSend,
        sender: currentUser.email,
        createdAt: serverTimestamp(),
        status: "sent",
      });
      // Mettre à jour le statut local
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, status: "sent" } : m))
      );
    } catch {
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, status: "error" } : m))
      );
    }
  };

  // 🔹 Marquer comme lu
  const markAsRead = async () => {
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      where("sender", "!=", currentUser.email)
    );
    const snap = await getDocs(q);
    snap.forEach((docu) => {
      updateDoc(
        doc(db, "conversations", conversationId, "messages", docu.id),
        { status: "read" }
      );
    });
  };

  // 🔹 Affichage message
  const renderItem = ({ item }: { item: Message }) => {
   const isMe = item.sender === currentUser.email;
  
    const time = item.createdAt instanceof Date 
  ? item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
  : item.createdAt?.seconds 
    ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

    let statusIcon;
  if (item.status === "sending") statusIcon = <Ionicons name="time-outline" size={14} color="#555" />;
  else if (item.status === "error") statusIcon = <Ionicons name="alert-circle-outline" size={14} color="red" />;
  else if (item.status === "sent") statusIcon = <Ionicons name="checkmark-outline" size={14} color="#555" />;
  else if (item.status === "read") statusIcon = <Ionicons name="checkmark-done-outline" size={14} color="#1DA1F2" />;



    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        {!isMe && (
          <Ionicons
    name="person-circle-outline"
    size={32}
    color="#999"
    style={{ marginRight: 8 }}
  />
        )}
        <View
          style={[
            styles.bubble,
            isMe ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.messageMeta}>
            <Text style={styles.timeText}>
                {item.createdAt && new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  
                {statusIcon && <View style={{ marginLeft: 4 }}>{statusIcon}</View>}        
            </Text>
          </View>
        </View>
{isMe && (
      <Ionicons
        name="person-circle-outline"
        size={34}
        color="#ffbf00"
        style={{ marginLeft: 6 }}
      />
    )}

      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Écrire un message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  messageRow: { flexDirection: "row", marginVertical: 5, alignItems: "flex-end" },
  myMessageRow: { justifyContent: "flex-end" },
  theirMessageRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "75%", padding: 10, borderRadius: 20 },
  myBubble: { backgroundColor: "#ffbf00", borderTopRightRadius: 0 },
  theirBubble: { backgroundColor: "#eee", borderTopLeftRadius: 0 },
  messageText: { fontSize: 16, color: "#000" },
  messageMeta: { flexDirection: "row", justifyContent: "flex-end", marginTop: 5 },
  timeText: { fontSize: 12, color: "#555", marginRight: 5 },
  statusIcon: { fontSize: 12 },
  inputRow: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderTopColor: "#ccc", backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 25, paddingHorizontal: 15, fontSize: 16, backgroundColor: "#f9f9f9" },
  sendBtn: { marginLeft: 10, backgroundColor: "#ffbf00", borderRadius: 25, padding: 12, justifyContent: "center", alignItems: "center" },
  avatar: { width: 35, height: 35, borderRadius: 18, marginRight: 8 },
});
