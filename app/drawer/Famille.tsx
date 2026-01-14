import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
} from "react-native";
import { auth, db } from "../../firebaseConfig";

function FamilyScreen() {
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
const [deleteModalVisible, setDeleteModalVisible] = useState(false);
const [familyToDelete, setFamilyToDelete] = useState<any>(null);

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

    setJoinCode("");
    setJoinModalVisible(false);
    Alert.alert("Succès", "Vous avez rejoint la famille avec succès !");
  };

  const handleDeletePress = (family: any) => {
  // Vérifier si l'utilisateur est le propriétaire
  const isOwner = family.ownerUid === user?.uid;
  
  if (!isOwner) {
    alert("❌ Permission refusée\n\nSeul le créateur de la famille peut la supprimer.");
    return;
  }

  setFamilyToDelete(family);
  setDeleteModalVisible(true);
};

const confirmDelete = async () => {
  if (!familyToDelete) return;
  
  setDeleteModalVisible(false);
  
  try {
    // Fermer le modal si la famille sélectionnée est celle qu'on supprime
    if (selectedFamily?.id === familyToDelete.id) {
      setSelectedFamily(null);
      setFamilyModalVisible(false);
    }

    // Supprimer toutes les sous-collections
    const subcollections = ["shopping", "todos", "calendar", "rewards", "budgets"];
    
    for (const subcollection of subcollections) {
      const subCol = collection(db, "families", familyToDelete.id, subcollection);
      const subDocs = await getDocs(subCol);
      
      for (const subDoc of subDocs.docs) {
        // Supprimer les sous-sous-collections (items, expenses)
        const itemsCol = collection(db, "families", familyToDelete.id, subcollection, subDoc.id, "items");
        const itemsDocs = await getDocs(itemsCol);
        for (const itemDoc of itemsDocs.docs) {
          await deleteDoc(itemDoc.ref);
        }
        
        const expensesCol = collection(db, "families", familyToDelete.id, subcollection, subDoc.id, "expenses");
        const expensesDocs = await getDocs(expensesCol);
        for (const expenseDoc of expensesDocs.docs) {
          await deleteDoc(expenseDoc.ref);
        }
        
        // Supprimer le document parent
        await deleteDoc(subDoc.ref);
      }
    }
    
    // Supprimer le document de la famille
    await deleteDoc(doc(db, "families", familyToDelete.id));
    
    setFamilyToDelete(null);
    alert("✅ Succès!\n\nLa famille et toutes ses données ont été supprimées.");
  } catch (err: any) {
    console.error("Erreur de suppression:", err);
    alert(`❌ Erreur\n\nImpossible de supprimer la famille.\n\nDétails: ${err?.message || err}`);
  }
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
      <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 20, fontWeight: "400", marginBottom: 10, color: "#FF8C42" }}>Gérez vos familles</Text>

<FlatList
  data={families}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={styles.familyRow}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          setSelectedFamily(item);
          setFamilyModalVisible(true);
        }}
      >
        <Text style={{fontFamily: "Montserrat_400Regular", fontSize: 16, color: "#60AFDF" }}>{item.name}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => openRoleManagementForFamily(item)}
        style={{ marginRight: 10 }}
      >
        <Ionicons name="people-circle" size={24} color="#6DDB31" />
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
        style={[styles.btn, { backgroundColor: "rgba(255, 140, 66, 0.2)" }]}
        onPress={() => setJoinModalVisible(true)}
      >
        <Text style={[styles.btnText, {color: "#FF8C42", borderColor: "#FF8C42"}]}>Rejoindre une famille</Text>
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
        <Ionicons name="close" size={22} color="#000"/>
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

      {/* Code de la famille */}
      {selectedFamily && selectedFamily.joinCode && (
        <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 16, marginBottom: 10 }}>
          Code famille : {selectedFamily.joinCode}
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
                { color: role.toLowerCase() === 'parent' ? '#1976D2' : '#FF8C42' }
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
        <Ionicons name="information-circle" size={24} color="#FF8C42" style={{ marginRight: 10 }} />
        <Text style={{ flex: 1, color: '#E65100', fontSize: 13 }}>
          Définissez le rôle de chaque membre dans cette famille.
        </Text>
      </View>

      <ScrollView style={{ maxHeight: 300 }}>
        {Object.entries(roleAssignments).map(([email, role]) => (
          <View key={email} style={styles.roleRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: '500', marginBottom: 8 }}>{email}</Text>
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

{/* Modal Confirmation de suppression */}
<Modal visible={deleteModalVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modal}>
      <Text style={[styles.modalTitle, { color: "#FF0000" }]}>⚠️ Attention</Text>
      
      <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 16, marginVertical: 15, textAlign: "center" }}>
        Voulez-vous vraiment supprimer la famille "{familyToDelete?.name}" ?
      </Text>
      
      <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" }}>
        Toutes les données liées (calendrier, listes, budget, récompenses) seront définitivement supprimées.
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: "#ccc", flex: 1 }]} 
          onPress={() => {
            setDeleteModalVisible(false);
            setFamilyToDelete(null);
          }}
        >
          <Text style={[styles.btnText, { color: "#000" }]}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: "#FF0000", flex: 1 }]} 
          onPress={confirmDelete}
        >
          <Text style={styles.btnText}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        onPress={() => {
          setDeleteModalVisible(false);
          setFamilyToDelete(null);
        }}
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
    backgroundColor: "#60AFDF33",
    borderWidth : 2,
    borderRadius: 10,
    borderColor: "#60AFDF", 
  },
  
  familyItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  btn: {
    backgroundColor: "#FF8C42",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
    color: "#FF8C42",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Montserrat_400Regular", 
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
    color: "#000"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "400",
    marginBottom: 10,
    fontFamily: "Shrikhand_400Regular",
    color: "#FF8C42",
  },
  input: {
    borderWidth: 1,
    borderColor: "#FF8C42",
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
    backgroundColor: '#FF8C42',
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

const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FamilyMain"
        component={FamilyScreen}
        options={({ navigation }) => ({
          headerTitle: "Mes familles",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: "Shrikhand_400Regular", 
            fontSize: 28,
            color: "#FF8C42",
            // fontWeight: 'bold' // Tu peux laisser, mais Shrikhand est déjà gras par défaut
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={40} style={{ marginLeft: 15, color:"#6DDB31" }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}