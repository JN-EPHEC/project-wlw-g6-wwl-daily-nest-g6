import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { addDoc, collection, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
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
  const navigation = useNavigation();
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
      const msgs: Message[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(msgs.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds));
    });
    markAsRead();

    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    // Écouter la touche Enter uniquement sur web
    if (Platform.OS !== "web") return;

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
        sender: currentUser.email!,
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
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m)));
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
      updateDoc(doc(db, "conversations", conversationId, "messages", docu.id), { status: "read" });
    });
  };

  // 🔹 Affichage message
  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender === currentUser.email;

    const time =
      item.createdAt instanceof Date
        ? item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : item.createdAt?.seconds
        ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

    let statusIcon;
    if (item.status === "sending") statusIcon = <Ionicons name="time-outline" size={14} color="#555" />;
    else if (item.status === "error") statusIcon = <Ionicons name="alert-circle-outline" size={14} color="red" />;
    else if (item.status === "sent") statusIcon = <Ionicons name="checkmark-outline" size={14} color="#555" />;
    else if (item.status === "read") statusIcon = <Ionicons name="checkmark-done-outline" size={14} color="#1DA1F2" />;

    return (
      <View
        className={`flex-row my-1 items-end ${isMe ? "justify-end" : "justify-start"}`}
      >

        <View
          className={`max-w-[75%] p-2.5 rounded-[16px] ${
            isMe ? "bg-[#E6F2FB] border border-[#60AFDF] rounded-tr-none py-1 whitespace-pre" : "bg-[#FFE9D8] border border-[#FF914D] rounded-tl-none"
          }`}
        >
          <Text className="text-base text-black">{item.text}</Text>

          <View className="flex-row justify-end mt-1.5">
            <Text className="text-[12px] text-[#555] mr-1">
              {item.createdAt &&
                new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {statusIcon && <View style={{ marginLeft: 4 }}>{statusIcon}</View>}
            </Text>
          </View>
        </View>

      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View className="flex-row justify-center items-center mb-1.5 relative px-5">
        {/* <ImageBackground
          source={require("../assets/images/fond_etoile_app.png")}
          resizeMode="cover"
          className="w-[120%] h-full -ml-20"
        />
        */}
        <View className="flex-col items-center mt-3 mb-2">
          <View className="w-[62px] h-[62px] rounded-full bg-[#D9D9D9] mr-3.5 items-center justify-center">
              {/*
              <Image
              source={require("../assets/images/mascotte_portrait_person.png")}
              className="w-5 h-5"
              /> 
              */}
              <Ionicons
                name={"person"}
                size={26}
                color="#9CA3AF"
              />
            </View>
          <Text
            className="text-[30px] font-extrabold italic text-[#FF914D] text-center tracking-[0.3px]"
            style={{ fontFamily: "Shrikhand_400Regular" }}
          >
            user firstName
          </Text>
        </View>
        {/* BOUTON setting 
        <TouchableOpacity
            className="absolute top-1 right-5 rounded-full  p-2"
            onPress={() => console.log("Settings") }
          >
            <Ionicons name="ellipsis-vertical"
             size={25} color="red" className="font-bold" />
          </TouchableOpacity>
          */}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />

      <View className="flex-row p-2.5 border-t border-[#ccc] bg-white">
        <TextInput
          className="flex-1 border border-[#60AFDF] rounded-full px-4 text-base bg-[#f9f9f9]"
          value={message}
          onChangeText={setMessage}
          placeholder="Écrire un message..."
        />
        <TouchableOpacity onPress={sendMessage} className="ml-2.5 bg-[#60AFDF] rounded-full p-3 justify-center items-center">
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
