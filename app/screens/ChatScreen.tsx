import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;

  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [createType, setCreateType] = useState<"private" | "group" | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const userEmail = user?.email;
  const [groupName, setGroupName] = useState("");


  if (!user) return null;

  // 🔹 Charger familles
  useEffect(() => {
    const q = query(
      collection(db, "families"),
      where("members", "array-contains", user.email)
    );

    return onSnapshot(q, snap => {
      setFamilies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // 🔹 Charger conversations
  useEffect(() => {
    if (!selectedFamily) {
      setConversations([]);
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

  await addDoc(collection(db, "conversations"), {
    familyId: selectedFamily.id,
    type: createType,
    title,
    members: [user.email, ...selectedMembers],
    createdAt: serverTimestamp(),
  });

  setModalVisible(false);
  setCreateType(null);
  setSelectedMembers([]);
  setGroupName("");
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Chat</Text>

      {/* PICKER FAMILLE */}
      <View style={styles.familyPickerContainer}>
  <Text style={styles.familyPickerLabel}>
    Choisir une famille
  </Text>

  <Picker
    selectedValue={selectedFamily?.id || ""}
    onValueChange={(value) => {
      const fam = families.find(f => f.id === value);
      setSelectedFamily(fam || null);
    }}
    style={styles.picker}
  >
    <Picker.Item
      label="Sélectionnez une famille"
      value=""
      color="#aaa"
    />
    {families.map(f => (
      <Picker.Item key={f.id} label={f.name} value={f.id} />
    ))}
  </Picker>
</View>


      {/* LISTE CONVERSATIONS */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          selectedFamily ? (
            <Text style={styles.emptyText}>Aucune conversation</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() =>
              navigation.navigate("Conversation", {
                conversationId: item.id,
              })
            }
          >
            <Ionicons
              name={item.type === "group" ? "people" : "person"}
              size={22}
              color="#ffbf00"
            />
            <Text style={styles.chatText}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />

      {/* BOUTON + */}
      {selectedFamily && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* MODAL CRÉATION */}
      <Modal visible={modalVisible} transparent animationType="fade">
        
        <TouchableWithoutFeedback onPress={() => {
    setModalVisible(false);
    setCreateType(null);
    setSelectedMembers([]);
  }}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
{!createType ? (
              <>
                <Text style={styles.modalTitle}>Créer</Text>

            <View style={styles.modalCard}>
  <TouchableOpacity onPress={() => setCreateType("private")}>
    <Text style={styles.modalAction}>🧑 Conversation privée</Text>
  </TouchableOpacity>
</View>

<View style={styles.modalCard}>
  <TouchableOpacity onPress={() => setCreateType("group")}>
    <Text style={styles.modalAction}>👨‍👩‍👧‍👦 Groupe</Text>
  </TouchableOpacity>
</View>
              </>
            ) : (
              <>
   {createType && (
  <>
    <Text style={styles.modalTitle}>Choisir membres</Text>

    {createType === "group" && (
      <TextInput
        placeholder="Nom du groupe"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.groupInput}
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
      style={styles.memberCard}
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

      <Text style={styles.memberText}>
        {m.firstName} {m.lastName}
      </Text>
    </TouchableOpacity>
  );
})}


<TouchableOpacity
  onPress={() => {
    // Vérifier le type et le nombre de membres
    if (createType === "private" && selectedMembers.length !== 1) return;
    if (createType === "group" && selectedMembers.length < 2) return;

    createConversation(); // ✅ pas d'arguments
    navigation.navigate("ConversationPage", { members: selectedMembers }); // redirection
  }}
  disabled={
    (createType === "private" && selectedMembers.length !== 1) ||
    (createType === "group" && selectedMembers.length < 2)
  }
  style={[
    styles.confirmBtn,
    ((createType === "private" && selectedMembers.length !== 1) ||
      (createType === "group" && selectedMembers.length < 2)) && {
      opacity: 0.4,
    },
  ]}
>
  <Text style={styles.confirmText}>Créer conversation</Text>
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
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: { fontSize: 26, fontWeight: "bold", color: "#ffbf00" },

  pickerBox: {
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 12,
    marginVertical: 15,
  },

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    marginBottom: 10,
  },

  chatText: { marginLeft: 10, fontSize: 16 },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
  },

  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ffbf00",
    borderRadius: 30,
    padding: 15,
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "85%",
  },

  

  modalOption: {
    fontSize: 16,
    paddingVertical: 12,
    textAlign: "center",
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },

  

  bubble: {
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: "75%",
  },

  me: {
    backgroundColor: "#ffbf00",
    alignSelf: "flex-end",
  },

  other: {
    backgroundColor: "#eaeaea",
    alignSelf: "flex-start",
  },

  bubbleText: { color: "black" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 10,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  familyPickerContainer: {
  backgroundColor: "#f9f9f9",
  borderRadius: 16,
  paddingHorizontal: 15,
  paddingVertical: 8,
  marginVertical: 15,
  borderWidth: 1,
  borderColor: "#eee",
},

familyPickerLabel: {
  fontSize: 13,
  color: "#999",
  fontStyle: "italic",
  marginBottom: 4,
},

picker: {
  height: 45,
  color: "#333",
},
 modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  alignItems: "center",
},

modalContainer: {
  width: "80%",
  backgroundColor: "white",
  borderRadius: 20,
  padding: 20,
},

modalTitle: {
  textAlign: "center",
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 15,
  color: "#333",
},

modalCard: {
  backgroundColor: "#f5f5f5",
  borderRadius: 14,
  padding: 15,
  marginBottom: 10,
},

modalAction: {
  textAlign: "center",
  fontSize: 15,
},

memberCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f7f7f7",
  padding: 12,
  borderRadius: 14,
  marginBottom: 8,
},

memberText: {
  marginLeft: 10,
  fontSize: 15,
},

confirmBtn: {
  marginTop: 15,
  backgroundColor: "#ffbf00",
  padding: 14,
  borderRadius: 14,
},

confirmText: {
  textAlign: "center",
  fontWeight: "bold",
},
groupInput: {
  width: "100%",
  paddingVertical: 12,
  paddingHorizontal: 14,
  marginBottom: 12,

  backgroundColor: "rgba(255,255,255,0.85)",
  borderRadius: 12,

  fontSize: 15,
  fontStyle: "italic",
  color: "#333",

  borderWidth: 1,
  borderColor: "#e0e0e0",
},



});
