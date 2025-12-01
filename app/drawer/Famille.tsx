import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function FamilyScreen() {
  const [families, setFamilies] = useState<any[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);

const [selectedFamily, setSelectedFamily] = useState<any>(null);
const [familyModalVisible, setFamilyModalVisible] = useState(false);
const [editFamilyModalVisible, setEditFamilyModalVisible] = useState(false);

useEffect(() => {
  const unsub = auth.onAuthStateChanged((u) => {
    setUser(u);
  });
  return unsub;
}, []);
// avoir les familles en temps réel 
  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db,"families"),
      where("members", "array-contains", user.email)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFamilies(list);
    });

    return () => unsub();
  }, [user?.email]);

  // Create family
 const createFamily = async () => {
  const currentUser = auth.currentUser;

  if (!familyName.trim()) {
    Alert.alert("Erreur", "Nom de la famille requis");
    return;
  }

  if (!currentUser || !currentUser.email) {
    console.log("USER IS NULL:", currentUser);
    Alert.alert("Erreur", "Utilisateur non connecté");
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

   const familyRef = await addDoc(collection(db, "families"), {
    name: familyName,
    ownerUid: user.uid,
    joinCode: code,
    members: [user.email],
  });
    await setDoc(doc(db, "users", user.uid, "familiesJoined", familyRef.id), {
    familyId: familyRef.id
  });

    setFamilyName("");
    setCreateModalVisible(false);};


  // Join family by code
  const handleJoinFamily = async () => {
    if (joinCode.length !== 6) return Alert.alert("Erreur", "Code invalide");

    const q = query(
      collection(db, "families"),
      where("joinCode", "==", joinCode)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return Alert.alert("Erreur", "Famille introuvable");
    }

    const fam = snap.docs[0];

    if ((fam.data().members || []).includes(user.email)) {
    return Alert.alert("Info", "Vous êtes déjà membre de cette famille");
  }


    await updateDoc(doc(db, "families", fam.id), {
      members: arrayUnion(user?.email),
    });

    await addDoc(collection(db, "users", user.uid, "familiesJoined", fam.id), {
    familyId: fam.id,
    familyName: fam.data().name || ""
  });

    setJoinCode("");
    setJoinModalVisible(false);
  };

  const handleDeletePress = (family: any) => {
  Alert.alert("Confirmation", "Voulez-vous vraiment supprimer cette famille ?", [
    { text: "Annuler" },
    {
      text: "Oui",
      onPress: async () => {
        try {
          await deleteDoc(doc(db, "families", family.id));
          setFamilies(prev => prev.filter(f => f.id !== family.id));
        } catch (err) {
          console.log("Erreur suppression famille:", err);
        }
      },
    },
  ]);
};

const updateFamilyName = async () => {
  if (!selectedFamily || !familyName.trim()) return;

  try {
    await updateDoc(doc(db,"families", selectedFamily.id), {
      name: familyName,
    });
    setFamilies(prev =>
      prev.map(f => (f.id === selectedFamily.id ? { ...f, name: familyName } : f))
    );
    setEditFamilyModalVisible(false);
    setFamilyName("");
  } catch (err) {
    console.log("Erreur update famille:", err);
  }
};



  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>Mes familles</Text>

<FlatList
  data={families}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedFamily(item);
        setFamilyModalVisible(true);
      }}
    >
      <View style={styles.familyRow}>
        <Text style={{ flex: 1, fontSize: 18 }}>{item.name}</Text>

        <TouchableOpacity
          onPress={() => {
            setFamilyName(item.name);
            setSelectedFamily(item);
            setEditFamilyModalVisible(true);
          }}
        >
          <Ionicons name="pencil" size={22} color="orange" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeletePress(item)}
          style={{ marginLeft: 10 }}
        >
          <Ionicons name="trash" size={22} color="red" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )}
/>

      {/* CREATE BUTTON */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setCreateModalVisible(true)}
      >
        <Text style={styles.btnText}>Créer une famille</Text>
      </TouchableOpacity>

      {/* JOIN BUTTON */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#555" }]}
        onPress={() => setJoinModalVisible(true)}
      >
        <Text style={styles.btnText}>Rejoindre une famille</Text>
      </TouchableOpacity>

      {/* CREATE MODAL */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Créer une famille</Text>
            <TextInput
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="Nom de famille"
              style={styles.input}
            />
            <TouchableOpacity style={styles.btn} onPress={createFamily}>
              <Text style={styles.btnText}>Créer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
        onPress={() => setCreateModalVisible(false)}
        style={{ position: "absolute", top: 10, right: 10 }}>
        <Ionicons name="close" size={22} color="black"/>
      </TouchableOpacity>
            
          </View>
        </View>
      </Modal>

      {/* JOIN MODAL */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Entrer le code</Text>
            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Entrez le code à 6 chiffres"
              keyboardType="numeric"
              maxLength={6}
              style={styles.input}
            />
            <TouchableOpacity style={styles.btn} onPress={handleJoinFamily}>
              <Text style={styles.btnText}>Rejoindre</Text>
            </TouchableOpacity>
            <TouchableOpacity 
        onPress={() => setJoinModalVisible(false)}
        style={{ position: "absolute", top: 10, right: 10 }}>
        <Ionicons name="close" size={22} color="black"/>
      </TouchableOpacity>
          </View>
        </View>
      </Modal>


<Modal visible={selectedFamily !== null} transparent animationType="fade">
    {selectedFamily && (
  <View style={styles.modalContainer}>
    <View style={styles.modal}>
      <Text style={styles.modalTitle}>{selectedFamily?.name}</Text>

      {/* Code seulement si owner */}
      {selectedFamily && selectedFamily.ownerUid === user?.uid && (
  <Text style={{ fontSize: 16, marginBottom: 10 }}>
    Code : {selectedFamily.joinCode}
  </Text>
)}


      {/* Membres */}
      {selectedFamily?.members?.map((m: string, index: number) => (
       <Text key={index} style={{ marginLeft: 10 }}>
         - {m}
       </Text>
      ))}


      <TouchableOpacity
        style={{ position: "absolute", top: 10, right: 10 }}
        onPress={() => setSelectedFamily(null)}
      >
        <Ionicons name="close" size={22} color="black"/>
      </TouchableOpacity>
    </View>
  </View>
  )}

</Modal>


      <Modal visible={editFamilyModalVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modal}>
      <Text style={styles.modalTitle}>Modifier la famille</Text>
      <TextInput
        value={familyName}
        onChangeText={setFamilyName}
        placeholder="Nom de famille"
        style={styles.input}
      />
      <TouchableOpacity style={styles.btn} onPress={updateFamilyName}>
        <Text style={styles.btnText}>Sauvegarder</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setEditFamilyModalVisible(false)}
        style={{ position: "absolute", top: 10, right: 10 }}>
        <Ionicons name="close" size={22} color="black"/>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </View>
  );
}

const styles = StyleSheet.create({
    familyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  
  familyItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  btn: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});
