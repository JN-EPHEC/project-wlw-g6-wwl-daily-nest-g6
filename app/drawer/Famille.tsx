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
const [roleManagementVisible, setRoleManagementVisible] = useState(false);
const [selectedFamilyForRoles, setSelectedFamilyForRoles] = useState<any>(null);
const [roleAssignments, setRoleAssignments] = useState<{[email: string]: string}>({});

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
    Alert.alert("Erreur", "Utilisateur non connecté");
    return;
  }

  // Générer un code unique entre 0 et 999999
  let code = "";
  let isUnique = false;
  
  while (!isUnique) {
    // Générer un code entre 0 et 999999 (padding avec des zéros si nécessaire)
    code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    // Vérifier si ce code existe déjà
    const existingCodeQuery = query(
      collection(db, "families"),
      where("joinCode", "==", code)
    );
    const existingCodeSnap = await getDocs(existingCodeQuery);
    
    // Si aucune famille n'utilise ce code, c'est bon
    if (existingCodeSnap.empty) {
      isUnique = true;
    }
  }

   const familyRef = await addDoc(collection(db, "families"), {
    name: familyName,
    ownerUid: user.uid,
    joinCode: code,
    members: [user.email],
  });

    setFamilyName("");
    setCreateModalVisible(false);
    Alert.alert(
      "Succès", 
      `Famille créée avec succès !\n\nVotre code famille : ${code}\n\nPartagez ce code pour inviter d'autres membres.`,
      [{ text: "OK" }]
    );
  };


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
    Alert.alert("Succès", "Vous avez rejoint la famille avec succès !");
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
          Alert.alert("Erreur", "Impossible de supprimer la famille");
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
    Alert.alert("Erreur", "Impossible de modifier la famille");
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
}
