import ThemedText from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  FieldValue,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;

  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationMeta, setConversationMeta] = useState<Record<string, any>>(
    {}
  );
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [createType, setCreateType] = useState<"private" | "group" | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const userEmail = user?.email;
  const [groupName, setGroupName] = useState("");

  const [editingGroup, setEditingGroup] = useState<any | null>(null);

  const formatTime = (value: any) => {
    if (!value) return "";
    const date =
      value instanceof Date
        ? value
        : typeof value?.toDate === "function"
        ? value.toDate()
        : typeof value?.seconds === "number"
        ? new Date(value.seconds * 1000)
        : null;
    if (!date) return "";
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  if (!user) return null;

  const conversationData = conversations.map(conversation => ({
    ...conversation,
    ...(conversationMeta[conversation.id] || {}),
  }));

  // 🔹 Charger familles
  useEffect(() => {
    const q = query(collection(db, "families"));

    return onSnapshot(q, snap => {
      const allFamilies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtrer pour ne garder que les familles où l'utilisateur est membre
      const userFamilies = allFamilies.filter(family => {
        const members = family.members || [];
        
        for (const memberItem of members) {
          if (typeof memberItem === 'string' && memberItem === user.email) {
            return true; // Format ancien (string)
          } else if (typeof memberItem === 'object' && memberItem.email === user.email) {
            return true; // Format nouveau (objet)
          }
        }
        return false;
      });
      
      setFamilies(userFamilies);
    });
  }, []);

  // 🔹 Charger conversations
  useEffect(() => {
    if (!selectedFamily) {
      setConversations([]);
      setConversationMeta({});
      return;
    }

    const q = query(
      collection(db, "conversations"),
      where("familyId", "==", selectedFamily.id),
      where("members", "array-contains", user.email)
    );

    return onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [selectedFamily]);

  useEffect(() => {
    if (!user?.email || conversations.length === 0) return;

    const unsubs: Array<() => void> = [];

    conversations.forEach(conversation => {
      const lastMessageQuery = query(
        collection(db, "conversations", conversation.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const unsubLast = onSnapshot(lastMessageQuery, snap => {
        const lastDoc = snap.docs[0];
        const lastData = lastDoc ? lastDoc.data() : null;
        setConversationMeta(prev => ({
          ...prev,
          [conversation.id]: {
            ...(prev[conversation.id] || {}),
            lastMessage: lastData?.text || "",
            lastMessageAt: lastData?.createdAt || null,
          },
        }));
      });
      unsubs.push(unsubLast);

      const unreadQuery = query(
        collection(db, "conversations", conversation.id, "messages"),
        where("status", "==", "sent")
      );
      const unsubUnread = onSnapshot(unreadQuery, snap => {
        const unreadCount = snap.docs.filter(docu => {
          const data = docu.data();
          return data.sender !== user.email;
        }).length;
        setConversationMeta(prev => ({
          ...prev,
          [conversation.id]: {
            ...(prev[conversation.id] || {}),
            unreadCount,
          },
        }));
      });
      unsubs.push(unsubUnread);
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [conversations, user?.email]);

  // 🔹 Charger membres famille
  useEffect(() => {
    if (!selectedFamily) return;

    const loadMembers = async () => {
      const members: any[] = [];

      for (const email of selectedFamily.members) {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);
        snap.forEach(d => members.push({ uid: d.id, ...d.data() }));
      }

      setFamilyMembers(members);
    };

    loadMembers();
  }, [selectedFamily]);

  // 🔹 Créer conversation
  const createConversation = async () => {
  if (!createType) return;

  if (createType === "private" && selectedMembers.length !== 1) return;
  if (createType === "group" && selectedMembers.length < 2) return;
  if (createType === "group" && !groupName.trim()) return;

  let title = "";

  if (createType === "private") {
    const other = familyMembers.find(
      m => m.email === selectedMembers[0]
    );
    title = other
      ? `${other.firstName} ${other.lastName}`
      : selectedMembers[0];
  }

  if (createType === "group") {
    title = groupName.trim();
  }

  const docRef = await addDoc(collection(db, "conversations"), {
    familyId: selectedFamily.id,
    type: createType,
    title,
    members: [user.email, ...selectedMembers],
    createdAt: serverTimestamp(),
  });

  navigation.navigate("Conversation", { conversationId: docRef.id });

  setModalVisible(false);
  setCreateType(null);
  setSelectedMembers([]);
  setGroupName("");
};
const editGroup = (group: any) => {

  setEditingGroup(group);
  setModalVisible(true);
  setCreateType("group");
  setGroupName(group.title);
  setSelectedMembers(group.members.filter((m: string) => m !== userEmail));
};

const updateGroup = async () => {
  if (!editingGroup) return;
  const groupRef = doc(db, "conversations", editingGroup.id);
  await updateDoc(groupRef, {
    title: groupName.trim(),
    members: [userEmail, ...selectedMembers],
  });
  setModalVisible(false);
  setEditingGroup(null);
  setCreateType(null);
  setSelectedMembers([]);
  setGroupName("");
};

const deleteGroup = async (group: any) => {
  try {
    await deleteDoc(doc(db, "conversations", group.id));
    console.log("Groupe supprimé !");
  } catch (err) {
    console.error("Erreur suppression groupe :", err);
  }
};


  return (
    <View className="flex-1 px-5 pt-[18px] bg-white">
      <View className="items-center mb-1.5 relative px-5">
        <Text
          className="text-[30px] font-extrabold italic text-[#FF914D] text-center tracking-[0.3px]"
          style={{ fontFamily: "Shrikhand_400Regular" }}
        >
          Messages
        </Text>
        {/* BOUTON + */}
        {selectedFamily && (
          <TouchableOpacity
            className="absolute top-4 right-5"
            onPress={() => setModalVisible(true)}
          >
        
          </TouchableOpacity>
        )}
      </View>
      
      

      

      {/* PICKER FAMILLE */}
      <View className=" rounded-[18px] px-3.5 py-2.5 my-3">
        <ThemedText type='subtitle'className="text-[12px] text-[#9CA3AF] italic mb-1.5 mt-1.5">
          Choisir une famille
        </ThemedText>
        <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Picker
            selectedValue={selectedFamily?.id || ""}
            onValueChange={(value) => {
              const fam = families.find((f) => f.id === value);
              setSelectedFamily(fam || null);
            }}
            className="h-[42px] bg-blue-100 border border-blue-200 text-[#374151] rounded-[18px] px-3"
          >
            <Picker.Item label="Sélectionnez une famille" value="" color="#aaa" />
            {families.map((f) => (
              <Picker.Item key={f.id} label={f.name} value={f.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
          className="w-10 h-10 shrink-0 rounded-full bg-[#EEFAE6] items-center justify-center"
        >
          <Ionicons name="add" size={28} color="#68cb30" />
        </TouchableOpacity>
      </View>

      </View>


      {/* LISTE CONVERSATIONS */}
      <FlatList
        data={conversationData}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          selectedFamily ? (
            <Text className="text-center mt-7.5 text-[#9CA3AF]">Aucune conversation</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="flex-row items-center py-3.5 border-b border-[#F3F4F6] flex-1"
              onPress={() =>
                navigation.navigate("Conversation", {
                  conversationId: item.id,
                })
              }
            >
              <View className="w-[62px] h-[62px] rounded-full bg-[#D9D9D9] mr-3.5 items-center justify-center">
                <Ionicons
                  name={item.type === "group" ? "people" : "person"}
                  size={26}
                  color="#9CA3AF"
                />
              </View>
              <View className="flex-1 mr-3">
                <Text className="text-[18px] font-extrabold italic text-[#FF914D]">{item.title}</Text>
                <Text className="mt-1 text-[13px] text-[#111827] font-bold" numberOfLines={1}>
                  {item.lastMessage || "..."}
                </Text>
              </View>
              <View className="items-end min-w-[54px]">
                <Text className="text-[14px] text-[#FF914D] font-bold">
                  {formatTime(item.lastMessageAt || item.updatedAt)}
                </Text>
                {!!item.unreadCount && (
                  <View className="mt-1.5 self-end min-w-[26px] h-6 rounded-full px-1.5 bg-[#F15B5B] items-center justify-center">
                    <Text className="text-[12px] text-white font-extrabold">{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {item.type === "group" && (
              <View className="flex-row gap-2.5 ml-2.5">
                <TouchableOpacity onPress={() => editGroup(item)}>
                  <Ionicons name="pencil-outline" size={20} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteGroup(item)}>
                  <Ionicons name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      

      {/* MODAL CRÉATION */}
      <Modal visible={modalVisible} transparent animationType="fade">
        
        <TouchableWithoutFeedback onPress={() => {
    setModalVisible(false);
    setCreateType(null);
    setSelectedMembers([]);
  }}>
        <View className="flex-1 bg-black/45 justify-center items-center px-5">
          <TouchableWithoutFeedback>
          <View className="w-[90%] bg-white rounded-[22px] p-[18px]">
{!createType ? (
              <>
                <TouchableOpacity
  onPress={() => {
    if (editingGroup) {
      updateGroup();
    } else {
      createConversation();
    }
  }}
  className="mt-3.5 bg-[#FF914D] py-3.5 rounded-[16px]"
>
  <Text className="text-center font-extrabold text-white">
    {editingGroup ? "Modifier le groupe" : "Créer conversation"}
  </Text>
</TouchableOpacity>


            <View className="bg-[#F9FAFB] rounded-[16px] p-3.5 mb-2.5 border border-[#EEF2F7]">
  <TouchableOpacity onPress={() => setCreateType("private")}>
    <Text className="text-center text-[15px] text-[#111827] font-semibold">Conversation privée</Text>
  </TouchableOpacity>
</View>

<View className="bg-[#F9FAFB] rounded-[16px] p-3.5 mb-2.5 border border-[#EEF2F7]">
  <TouchableOpacity onPress={() => setCreateType("group")}>
    <Text className="text-center text-[15px] text-[#111827] font-semibold">👨‍👩‍👧‍👦Groupe</Text>
  </TouchableOpacity>
</View>
              </>
            ) : (
              <>
   {createType && (
  <>
    <Text className="text-center text-[18px] font-bold mb-3.5 text-[#111827]">Choisir membres</Text>

    {createType === "group" && (
      <TextInput
        placeholder="Nom du groupe"
        value={groupName}
        onChangeText={setGroupName}
        className="w-full py-3 px-3.5 mb-3 bg-[#F9FAFB] rounded-[14px] text-[14px] text-[#111827] border border-[#E5E7EB]"
        placeholderTextColor="#aaa"
      />
    )}

  </>
)}




{familyMembers
.filter(m => m.email !== userEmail)
.map(m => {
  const selected = selectedMembers.includes(m.email);
  console.log(familyMembers);

  return (
    <TouchableOpacity
      key={m.email}
      className="flex-row items-center bg-[#F9FAFB] p-3 rounded-[16px] mb-2 border border-[#EEF2F7]"
      onPress={() =>
        setSelectedMembers(prev =>
          selected
            ? prev.filter(email=> email !== m.email)
            : [...prev, m.email]
        )
      }
    >
      <Ionicons
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={22}
        color={selected ? "#ffbf00" : "#ccc"}
      />

      <Text className="ml-2.5 text-[14px] text-[#111827] font-semibold">
        {m.firstName} {m.lastName}
      </Text>
    </TouchableOpacity>
  );
})}


<TouchableOpacity
  onPress={createConversation}
  disabled={
    (createType === "private" && selectedMembers.length !== 1) ||
    (createType === "group" && selectedMembers.length < 2)
  }
  className={`mt-3.5 bg-[#FF914D] py-3.5 rounded-[16px] ${
    ((createType === "private" && selectedMembers.length !== 1) ||
      (createType === "group" && selectedMembers.length < 2))
      ? "opacity-40"
      : ""
  }`}
>
  <Text className="text-center font-extrabold text-white">Créer conversation</Text>
</TouchableOpacity>

              </>
            )}
          </View>
          </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
function docRef(arg0: CollectionReference<DocumentData, DocumentData>, arg1: { familyId: any; type: "private" | "group"; title: string; members: (string | null)[]; createdAt: FieldValue; }) {
  throw new Error("Function not implemented.");
}
