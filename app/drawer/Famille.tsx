import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";


export function FamilyScreen() {
  const [families, setFamilies] = useState<any[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);

const [selectedFamily, setSelectedFamily] = useState<any>(null);
const [familyModalVisible, setFamilyModalVisible] = useState(false);
const [editFamilyModalVisible, setEditFamilyModalVisible] = useState(false);

const navigation = useNavigation();

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
    debugger;
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

    await addDoc(collection(db, "users" + user.uid + "familiesJoined" + fam.id), {
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
        {/* Photo de profil du groupe */}
        <Ionicons name="people-circle" size={60} color="#00b7ff9a" style={{ marginRight: 15 }} />

        {/* Nom de la famille */}
        <Text style={styles.familyName}>{item.name}</Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Modifier */}
          <TouchableOpacity
            onPress={() => {
              setFamilyName(item.name);
              setSelectedFamily(item);
              setEditFamilyModalVisible(true);
            }}
            style={styles.trashBtnP}
          >
            <Ionicons name="pencil" size={24} color="orange" />
          </TouchableOpacity>

          {/* Supprimer */}
          {item.ownerUid === user?.uid && (
            <TouchableOpacity
              onPress={() => handleDeletePress(item)}
             style={styles.trashBtn}
            >
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )}
/>

     {/* CREATE BUTTON */}
<TouchableOpacity
  style={styles.btnPrimary}
  onPress={() => setCreateModalVisible(true)}
>
  <Text style={styles.btnTextStyled}>Créer une famille</Text>
</TouchableOpacity>

{/* JOIN BUTTON */}
<TouchableOpacity
  style={styles.btnSecondary}
  onPress={() => setJoinModalVisible(true)}
>
  <Text style={styles.btnTextStyled}>Rejoindre une famille</Text>
</TouchableOpacity>

      <Modal visible={createModalVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modalStyled}>
      <Text style={styles.modalTitleStyled}>Créer une famille</Text>

      <TextInput
        value={familyName}
        onChangeText={setFamilyName}
        placeholder="Nom de famille"
        style={styles.inputStyled}
      />

      <TouchableOpacity style={styles.btnStyled} onPress={createFamily}>
        <Text style={styles.btnTextStyled}>Créer</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setCreateModalVisible(false)}
        style={styles.closeModalBtn}
      >
        <Ionicons name="close" size={22} color="black"/>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      
      {/* JOIN MODAL */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modalStyled}>
      <Text style={styles.modalTitleStyled}>Rejoindre une famille</Text>

      <TextInput
        value={joinCode}
        onChangeText={setJoinCode}
        placeholder="Entrez le code à 6 chiffres"
        keyboardType="numeric"
        maxLength={6}
        style={styles.inputStyled}
      />

      <TouchableOpacity style={styles.btnStyled} onPress={handleJoinFamily}>
        <Text style={styles.btnTextStyled}>Rejoindre</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setJoinModalVisible(false)}
        style={styles.closeModalBtn}
      >
        <Ionicons name="close" size={22} color="black"/>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


<Modal visible={selectedFamily !== null} transparent animationType="fade">
  {selectedFamily && (
    <View style={styles.modalContainer}>
      <View style={styles.modalCenter}>
        {/* Photo et nom de la famille */}
        <View style={styles.modalHeader}>
          <Ionicons name="people-circle" size={60} color="#00b7ff9a" style={{ marginBottom: 10 }} />
          <Text style={styles.modalTitle}>{selectedFamily.name}</Text>
          {selectedFamily.ownerUid === user?.uid && (
            <Text style={styles.familyCode}>Code : {selectedFamily.joinCode}</Text>
          )}
        </View>

        {/* Membres */}
        <View style={{ marginTop: 15 }}>
          {selectedFamily.members?.map((m: string, index: number) => (
            <View key={index} style={styles.memberCard}>
              <Ionicons name="person-circle" size={40} color="#00b7ff9a" />
              <Text style={styles.memberName}>{m.split("@")[0]}</Text>

              {/* Supprimer membre si admin et pas lui-même */}
              {selectedFamily.ownerUid === user?.uid && m !== user.email && (
                <TouchableOpacity
                  style={styles.trashBtn}
                  onPress={() => Alert.alert("Supprimer membre", m)}
                >
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Fermer modal */}
        <TouchableOpacity
          style={styles.closeModalBtn}
          onPress={() => setSelectedFamily(null)}
        >
          <Ionicons name="close" size={22} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  )}
</Modal>


      <Modal visible={editFamilyModalVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modal}>
        <View>
                <Ionicons name="person-circle" size={80} color="#00b7ff9a" />
              </View>
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

const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfilMain"
        component={FamilyScreen}
        options={({ navigation }) => ({
          headerTitle: "Mes Familles",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={26} style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
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

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  familyRow: {
  flexDirection: "row",
  alignItems: "center",
  padding: 15,
  marginVertical: 5,
  backgroundColor: "#f5f5f5",
  borderRadius: 12,
},
familyName: {
  flex: 1,
  fontSize: 18,
  fontWeight: "600",
  color: "#333",
},
iconBtn: {
  marginLeft: 10,
},

memberBox: {
  width: 70,
  alignItems: "center",
  margin: 5,
  position: "relative",
},
addMemberBtn: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 10,
},

modal: {
  width: "100%",
  backgroundColor: "white",
  borderRadius: 12,
  padding: 20,
  maxHeight: "80%",
},


membersContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 10, // pour espacer les membres
},
addMemberCard: {
  width: 70,
  height: 90,
  borderRadius: 10,
  backgroundColor: "#eee",
  justifyContent: "center",
  alignItems: "center",
  margin: 5,
},

modalLeft: {
  width: "80%",
  backgroundColor: "white",
  borderRadius: 12,
  padding: 15,
},
modalHeaderLeft: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 15,
  gap: 10,
},

memberRow: {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: 5,
},
memberNameRow: {
  flex: 1,
  marginLeft: 10,
  fontSize: 14,
  color: "#333",
},
trashBtnRow: {
  padding: 5,
},
addMemberRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
},



modalStyled: {
  width: "85%",
  backgroundColor: "#fff",
  borderRadius: 15,
  padding: 25,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 5,
},
modalTitleStyled: {
  fontSize: 20,
  fontWeight: "700",
  marginBottom: 20,
  color: "#333",
},
inputStyled: {
  width: "100%",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
  fontSize: 16,
  marginBottom: 20,
},
btnStyled: {
  backgroundColor: "#00b7ff",
  paddingVertical: 12,
  paddingHorizontal: 30,
  borderRadius: 10,
  alignItems: "center",
  width: "100%",
},
btnTextStyled: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 16,
},
btnPrimary: {
  backgroundColor: "#00b7ff",
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 12,
  alignItems: "center",
  marginVertical: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 3,
},
btnSecondary: {
  backgroundColor: "#555",
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 12,
  alignItems: "center",
  marginVertical: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 3,
},

modalContainer: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
},
modalCenter: {
  width: "90%",
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  maxHeight: "80%",
},
modalHeader: {
  alignItems: "center",
  marginBottom: 10,
},
modalTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#222",
},
familyCode: {
  fontSize: 14,
  color: "#555",
  marginTop: 4,
},
memberCard: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#f7f8fa",
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  elevation: 1,
},
memberName: {
  flex: 1,
  marginLeft: 12,
  fontSize: 16,
  color: "#111",
},
trashBtn: {
  padding: 6,
  borderRadius: 8,
  backgroundColor: "#ffe5e5",
},
closeModalBtn: {
  position: "absolute",
  top: 12,
  right: 12,
  padding: 8,
  borderRadius: 12,
  backgroundColor: "#f2f2f2",
},
trashBtnP: {
  padding: 6,
  borderRadius: 8,
  backgroundColor: "#fff5e5ff",
  marginRight: 8,
},



});
