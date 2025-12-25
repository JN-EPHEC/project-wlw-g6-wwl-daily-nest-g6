import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
<<<<<<< HEAD
<<<<<<< HEAD
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
=======
=======
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
>>>>>>> 160d9f6 (Display famille)
import {
    addDoc,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
>>>>>>> 4304248 (les rôles)
} from "react-native";
import { auth, db } from "../../firebaseConfig";

function FamilyScreen() {
  const [families, setFamilies] = useState<any[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);


const [familyModalVisible, setFamilyModalVisible] = useState(false);
const [editFamilyModalVisible, setEditFamilyModalVisible] = useState(false);
const [roleManagementVisible, setRoleManagementVisible] = useState(false);
const [selectedFamilyForRoles, setSelectedFamilyForRoles] = useState<any>(null);
const [roleAssignments, setRoleAssignments] = useState<{[email: string]: string}>({});
<<<<<<< HEAD
const [invitations, setInvitations] = useState<any[]>([]);

const [eventModalVisible, setEventModalVisible] = useState(false);
const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
const [allFamilies, setAllFamilies] = useState<any[]>([]);

const [message, setMessage] = useState("");


const [date, setDate] = useState<Date | null>(null);

const [selectedTime, setSelectedTime] = useState<string | null>(null);
const [showDatePicker, setShowDatePicker] = useState(false);


const [time, setTime] = useState<string | null>(null);
const [showTimePicker, setShowTimePicker] = useState(false);
const [newItemDate, setNewItemDate] = useState<string>("");
const [newItemTime, setNewItemTime] = useState<string>("");
=======
>>>>>>> 4304248 (les rôles)

useEffect(() => {
  const unsub = auth.onAuthStateChanged((u) => {
    setUser(u);
  });
  return unsub;
}, []);
// avoir les familles en temps réel 
  useEffect(() => {
    if (!user?.email) return;

    // Charger TOUTES les familles et filtrer côté client (pour supporter les deux formats)
    const q = query(collection(db, "families"));

    const unsub = onSnapshot(q, (snap) => {
      const allFamilies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Filtrer pour ne garder que les familles où l'utilisateur est membre
      const userFamilies = allFamilies.filter((family: any) => {
        const members = family.members || [];
        
        for (const memberItem of members) {
          if (typeof memberItem === 'string' && memberItem === user.email) {
            return true; // Format ancien
          } else if (typeof memberItem === 'object' && memberItem.email === user.email) {
            return true; // Format nouveau
          }
        }
        return false;
      });
      
      setFamilies(userFamilies);
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

    setFamilyName("");
    setCreateModalVisible(false);
    Alert.alert("Succès", "Famille créée avec succès !");
  };
<<<<<<< HEAD
useEffect(() => {
  const loadAllFamilies = async () => {
    const snap = await getDocs(collection(db, "families"));
    const familiesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAllFamilies(familiesData);
  };
  loadAllFamilies();
}, []);
=======

>>>>>>> 4304248 (les rôles)

  // Join family by code
  const handleJoinFamily = async () => {
  if (joinCode.length !== 6) {
    return Alert.alert("Erreur", "Code invalide");
  }

  const q = query(
    collection(db, "families"),
    where("joinCode", "==", joinCode)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return Alert.alert("Erreur", "Famille introuvable");
  }

  const famDoc = snap.docs[0];
  const famData = famDoc.data();

  // Déjà membre ?
  const alreadyMember = (famData.members || []).some(
    (m: any) => (typeof m === "string" ? m === user.email : m.email === user.email)
  );

  if (alreadyMember) {
    return Alert.alert("Info", "Vous êtes déjà membre de cette famille");
  }

<<<<<<< HEAD
  // Créer une invitation
  await addDoc(collection(db, "familyInvitations"), {
    familyId: famDoc.id,
    familyName: famData.name,
    fromEmail: user.email,
    toOwnerUid: famData.ownerUid,
    status: "pending",
    createdAt: new Date(),
  });

  setJoinCode("");
  setJoinModalVisible(false);

  Alert.alert(
    "Demande envoyée",
    "Une demande a été envoyée à l'administrateur de la famille."
  );
};
const acceptInvitation = async (inv: any) => {
  const familyRef = doc(db, "families", inv.familyId);



  await updateDoc(doc(db, "familyInvitations", inv.id), {
    status: "accepted",
  });
};
const rejectInvitation = async (inv: any) => {
  await updateDoc(doc(db, "familyInvitations", inv.id), {
    status: "rejected",
  });
};


=======

    await updateDoc(doc(db, "families", fam.id), {
      members: arrayUnion(user?.email),
    });

    setJoinCode("");
    setJoinModalVisible(false);
    Alert.alert("Succès", "Vous avez rejoint la famille avec succès !");
  };
>>>>>>> 4304248 (les rôles)

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
useEffect(() => {
  if (!user?.uid) return;

  const q = query(
    collection(db, "familyInvitations"),
    where("toOwnerUid", "==", user.uid),
    where("status", "==", "pending")
  );

  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setInvitations(data);
  });

  return () => unsub();
}, [user?.uid]);

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

// Ouvrir le modal de gestion des rôles pour une famille
const openRoleManagementForFamily = async (family: any) => {
  setSelectedFamilyForRoles(family);
  
  // Récupérer les données à jour de la famille
  const familyDoc = await getDoc(doc(db, 'families', family.id));
  if (!familyDoc.exists()) return;
  
  const familyData = familyDoc.data();
  
  // Initialiser les rôles actuels
  const currentRoles: {[email: string]: string} = {};
  const familyMembers = familyData.members || [];
  
  for (const memberItem of familyMembers) {
    if (typeof memberItem === 'string') {
      currentRoles[memberItem] = 'Enfant';
    } else {
      currentRoles[memberItem.email] = memberItem.role || 'Enfant';
    }
  }
  
  setRoleAssignments(currentRoles);
  setRoleManagementVisible(true);
};
<<<<<<< HEAD
const handleSendEvent = async () => {
  console.log("🚀 Envoi événement…");
  console.log("selectedFamily:", selectedFamily);
  console.log("date:", date);
  console.log("time:", time);
  console.log("message:", message);
  console.log("user email:", user?.email);

  // Vérifications avant envoi
  if (!selectedFamily) {
    return Alert.alert("Erreur", "Veuillez sélectionner une famille");
  }
  if (!date) {
    return Alert.alert("Erreur", "Veuillez sélectionner une date");
  }
  if (!time) {
    return Alert.alert("Erreur", "Veuillez sélectionner une heure");
  }
  if (!user?.email) {
    return Alert.alert("Erreur", "Utilisateur non connecté");
  }

  try {
    await addDoc(collection(db, "familyEvents"), {
      familyId: typeof selectedFamily === "string" ? selectedFamily : selectedFamily?.id,
      date: date.toISOString(),
      time,
      message: message || "",
      createdBy: user.email,
      createdAt: new Date(),
    });

    console.log("✅ Événement envoyé !");
    
    // Réinitialiser les champs
    setEventModalVisible(false);
    setSelectedFamily(null);
    setDate(null);
    setTime(null);
    setMessage("");

    Alert.alert("Succès", "Invitation envoyée !");
  } catch (err) {
    console.error("❌ Erreur en envoyant l'événement :", err);
    Alert.alert("Erreur", "Impossible d'envoyer l'invitation. Vérifiez vos champs et vos droits Firestore.");
  }
};
=======
>>>>>>> 4304248 (les rôles)

// Sauvegarder les rôles dans Firestore
const saveRoles = async () => {
  if (!selectedFamilyForRoles) return;
  
  try {
    const newMembers = Object.entries(roleAssignments).map(([email, role]) => ({
      email,
      role
    }));
    
    await setDoc(doc(db, 'families', selectedFamilyForRoles.id), {
      members: newMembers
    }, { merge: true });
    
    Alert.alert('Succès', 'Les rôles ont été mis à jour!');
    setRoleManagementVisible(false);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des rôles:', error);
    Alert.alert('Erreur', 'Impossible de sauvegarder les rôles');
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
          onPress={() => openRoleManagementForFamily(item)}
          style={{ marginRight: 10 }}
        >
          <Ionicons name="people-circle" size={24} color="#007AFF" />
        </TouchableOpacity>

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

{invitations.length > 0 && families.some(f => f.ownerUid === user?.uid) && (
  <>
    <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 20 }}>
      Demandes en attente
    </Text>

    {invitations.map(inv => (
      <View key={inv.id} style={styles.inviteRow}>
        <Text style={{ flex: 1 }}>
          {inv.fromEmail} → {inv.familyName}
        </Text>

        {/* ACCEPTER */}
        <TouchableOpacity onPress={() => acceptInvitation(inv)}>
          <Ionicons name="checkmark-circle" size={26} color="green" />
        </TouchableOpacity>

        {/* REFUSER */}
        <TouchableOpacity onPress={() => rejectInvitation(inv)}>
          <Ionicons name="close-circle" size={26} color="red" />
        </TouchableOpacity>
      </View>
    ))}
  </>
)}
{invitations.length === 0 && (
  <Text style={{ marginTop: 20, color: "#888" }}>
    Aucune demande en attente
  </Text>
)}


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
      {selectedFamily?.members?.map((m: any, index: number) => {
        const email = typeof m === 'string' ? m : m.email;
        const role = typeof m === 'string' ? 'Non défini' : (m.role || 'Non défini');
        return (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 5 }}>
            <Text style={{ flex: 1 }}>- {email}</Text>
            <View style={[
              { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
              { backgroundColor: role.toLowerCase() === 'parent' ? '#E3F2FD' : '#FFF3E0' }
            ]}>
              <Text style={[
                { fontSize: 11, fontWeight: '600' },
                { color: role.toLowerCase() === 'parent' ? '#1976D2' : '#F57C00' }
              ]}>
                {role}
              </Text>
            </View>
          </View>
        );
      })}


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

{/* Modal Gestion des Rôles */}
<Modal visible={roleManagementVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modal}>
      <Text style={styles.modalTitle}>Gérer les rôles - {selectedFamilyForRoles?.name}</Text>

      <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="information-circle" size={24} color="#F57C00" style={{ marginRight: 10 }} />
        <Text style={{ flex: 1, color: '#E65100', fontSize: 13 }}>
          Définissez le rôle de chaque membre dans cette famille.
        </Text>
      </View>

      <ScrollView style={{ maxHeight: 300 }}>
        {Object.entries(roleAssignments).map(([email, role]) => (
          <View key={email} style={styles.roleRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 5 }}>{email}</Text>
              <Picker
                selectedValue={role}
                onValueChange={(value) => setRoleAssignments({ ...roleAssignments, [email]: value })}
                style={styles.rolePicker}
              >
                <Picker.Item label="Parent" value="Parent" />
                <Picker.Item label="Enfant" value="Enfant" />
              </Picker>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.saveRoleButton} onPress={saveRoles}>
        <Text style={styles.saveRoleButtonText}>Enregistrer les rôles</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setRoleManagementVisible(false)}
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

  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  roleRow: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  rolePicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveRoleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  saveRoleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  inviteRow: {
  flexDirection: "row",
  alignItems: "center",
  padding: 12,
  backgroundColor: "#f1f1f1",
  borderRadius: 10,
  marginTop: 8,
},
container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "white" 
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 20, 
    color: "#ffbf00" 
  },
  addItemRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15 
  },
  dateRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15 
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    justifyContent: "center",
  },
  timeInput: {
    width: 80,
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
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
    fontSize: 16,
  },
  roleRow: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  rolePicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveRoleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  saveRoleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

<<<<<<< HEAD


=======
>>>>>>> 160d9f6 (Display famille)
const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FamilyMain"
        component={FamilyScreen}
        options={({ navigation }) => ({
          headerTitle: "Mes familles",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={26} style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 160d9f6 (Display famille)
