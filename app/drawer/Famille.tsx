import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, collectionGroup, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function FamilyScreen() {
  const [user, setUser] = useState(auth.currentUser);
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editFamilyModalVisible, setEditFamilyModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  const [familyName, setFamilyName] = useState("");
  const [newMember, setNewMember] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [email, setEmail] = useState(user?.email ?? null);


  // Charger toutes les familles où l'utilisateur est membre

 useEffect(() => {
  if (!user?.email) return;

  const q = query(
    collectionGroup(db, "families"), 
    where("members", "array-contains", user.email)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const fams: any[] = [];
    snapshot.forEach(docSnap => {
      fams.push({ id: docSnap.id, ownerId: docSnap.ref.parent.parent?.id, ...docSnap.data() });
    });
    setFamilies(fams);
  });

  return () => unsubscribe();
}, [user?.email]);

  // Créer famille
  const createFamily = async () => {
  if (!user || !familyName.trim()) return;

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await addDoc(collection(db, "users", user.uid, "families"), {
    name: familyName,
    code,
    members: [user.email],
    owner: user.email,
    pendingRequests: []
  });

  setFamilyName("");
  setCreateModalVisible(false);
  // pas besoin de fetchFamilies(), le onSnapshot fera le reste
};

const fetchFamilies = async () => {
  if (!user) return;
  const usersSnapshot = await getDocs(collection(db, "users"));
  const allFamilies: any[] = [];

  for (const u of usersSnapshot.docs) {
    const familiesCol = collection(db, "users", u.id, "families");
    const familiesSnap = await getDocs(familiesCol);
    familiesSnap.forEach(f => {
      const data = f.data();
      if (data.members.includes(user.email)) {
        allFamilies.push({ id: f.id, ownerId: u.id, ...data });
      }
    });
  }

  setFamilies(allFamilies);
};


  // Rejoindre famille
  const joinFamily = async () => {
    if (!joinCode.trim() || !user) return;

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      let familyFound: any = null;

      for (const u of usersSnapshot.docs) {
        const familiesCol = collection(db, "users", u.id, "families");
        const q = query(familiesCol, where("code", "==", joinCode));
        const qSnapshot = await getDocs(q);

        if (!qSnapshot.empty) {
          familyFound = {
            docId: qSnapshot.docs[0].id,
            userId: u.id,
            data: qSnapshot.docs[0].data(),
          };
          break;
        }
      }

      if (!familyFound) {
        Alert.alert("Erreur", "Code de famille introuvable !");
        return;
      }

      // Vérifier si déjà membre
      if (familyFound.data.members.includes(user.email)) {
        Alert.alert("Info", "Vous faites déjà partie de cette famille !");
        return;
      }

      // Ajouter dans pendingRequests
      const familyDocRef = doc(db, "users", familyFound.userId, "families", familyFound.docId);
      await updateDoc(familyDocRef, {
        pendingRequests: [...(familyFound.data.pendingRequests || []), { email: user.email, name: user.displayName || "" }],
      });

      Alert.alert("Demande envoyée", "L'owner doit accepter votre demande pour rejoindre la famille.");
      setJoinCode("");
      setJoinModalVisible(false);

    } catch (error: any) {
      console.log("Erreur rejoindre famille :", error);
      Alert.alert("Erreur", "Impossible de rejoindre la famille. Réessayez.");
    }
  };

  // Modifier nom famille
  const updateFamilyName = async () => {
    if (!familyName.trim() || !user || !selectedFamily) return;
    const familyDocRef = doc(db, "users", selectedFamily.ownerId, "families", selectedFamily.id);
    await updateDoc(familyDocRef, { name: familyName });
    setSelectedFamily({ ...selectedFamily, name: familyName });
    setEditFamilyModalVisible(false);
  };

  // Ajouter membre
  const addMember = async () => {
    if (!newMember.trim() || !user || !selectedFamily) return;
    if (!selectedFamily.members.includes(newMember)) {
      const familyDocRef = doc(db, "users", selectedFamily.ownerId, "families", selectedFamily.id);
      await updateDoc(familyDocRef, {
        members: [...selectedFamily.members, newMember],
      });
      setSelectedFamily({ ...selectedFamily, members: [...selectedFamily.members, newMember] });
      setNewMember("");
    } else {
      Alert.alert("Erreur", "Ce membre existe déjà");
    }
  };

  // Supprimer membre
  const removeMember = async (email: string) => {
    if (!user || !selectedFamily) return;
    const filtered = selectedFamily.members.filter((m: string) => m !== email);
    const familyDocRef = doc(db, "users", selectedFamily.ownerId, "families", selectedFamily.id);
    await updateDoc(familyDocRef, { members: filtered });
    setSelectedFamily({ ...selectedFamily, members: filtered });
  };

  // Supprimer famille
  const deleteFamily = async (id: string) => {
    if (!user || !selectedFamily) return;
    Alert.alert("Confirmation", "Voulez-vous vraiment supprimer cette famille ?", [
      { text: "Annuler" },
      { text: "Oui", onPress: async () => {
          const familyDocRef = doc(db, "users", selectedFamily.ownerId, "families", id);
          await deleteDoc(familyDocRef);
          setModalVisible(false);
        } 
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mes Familles</Text>

      <TouchableOpacity style={styles.button} onPress={() => setCreateModalVisible(true)}>
        <Text style={styles.buttonText}>Créer une famille</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => setJoinModalVisible(true)}>
        <Text style={styles.buttonText}>Rejoindre une famille avec un code</Text>
      </TouchableOpacity>

      <FlatList
        data={families}
        keyExtractor={(i) => i.id}
        style={{ marginTop: 15 }}
        renderItem={({ item }) => (
          <View style={styles.familyRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => { setSelectedFamily(item); setModalVisible(true); }}>
              <Text style={styles.familyText}>{item.name}</Text>
            </TouchableOpacity>

            {item.ownerId === user?.uid && (
              <>
                <TouchableOpacity onPress={() => { setSelectedFamily(item); setFamilyName(item.name); setEditFamilyModalVisible(true); }}>
                  <Ionicons name="pencil" size={22} color="orange" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => deleteFamily(item.id)}>
                  <Ionicons name="trash" size={22} color="red" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      />

      {/* Modal famille */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.popup}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedFamily?.name}</Text>

            {selectedFamily?.ownerId === user?.uid && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
                <TouchableOpacity onPress={() => { setFamilyName(selectedFamily.name); setEditFamilyModalVisible(true); }}>
                  <Ionicons name="pencil" size={22} color="orange" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteFamily(selectedFamily.id)}>
                  <Ionicons name="trash" size={22} color="red" />
                </TouchableOpacity>
              </View>
            )}

            <Text style={{ marginBottom: 15 }}>Code : {selectedFamily?.code}</Text>

            <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Membres :</Text>
            {selectedFamily?.members?.map((m: string, idx: number) => (
              <View key={idx} style={styles.memberRow}>
                <Text>{m}</Text>
                {m !== selectedFamily?.owner && selectedFamily?.ownerId === user?.uid && (
                  <TouchableOpacity onPress={() => removeMember(m)}>
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {selectedFamily?.pendingRequests?.length > 0 && selectedFamily.ownerId === user?.uid && (
              <>
                <Text style={{ fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>Demandes en attente :</Text>
                {selectedFamily.pendingRequests.map((req: any, idx: number) => (
                  <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", padding: 10, backgroundColor: "#ffe7c6", borderRadius: 10, marginVertical: 5 }}>
                    <Text>{req.email}</Text>
                    <View style={{ flexDirection: "row" }}>
                      <TouchableOpacity onPress={async () => {
                        const updatedMembers = [...selectedFamily.members, req.email];
                        const updatedRequests = selectedFamily.pendingRequests.filter((r: any) => r.email !== req.email);
                        const familyDocRef = doc(db, "users", user.uid, "families", selectedFamily.id);
                        await updateDoc(familyDocRef, { members: updatedMembers, pendingRequests: updatedRequests });
                        setSelectedFamily({ ...selectedFamily, members: updatedMembers, pendingRequests: updatedRequests });
                      }}>
                        <Ionicons name="checkmark" size={20} color="green" style={{ marginRight: 10 }} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={async () => {
                        const updatedRequests = selectedFamily.pendingRequests.filter((r: any) => r.email !== req.email);
                        const familyDocRef = doc(db, "users", user.uid, "families", selectedFamily.id);
                        await updateDoc(familyDocRef, { pendingRequests: updatedRequests });
                        setSelectedFamily({ ...selectedFamily, pendingRequests: updatedRequests });
                      }}>
                        <Ionicons name="close" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            <TextInput
              placeholder="Ajouter membre (email)"
              style={styles.input}
              value={newMember}
              onChangeText={setNewMember}
              onSubmitEditing={addMember}
            />
            <TouchableOpacity style={styles.button} onPress={addMember}>
              <Text style={styles.buttonText}>Ajouter membre</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={{ color: "white" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal créer famille */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.popup}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer une Famille</Text>
            <TextInput style={styles.input} placeholder="Nom de la famille" value={familyName} onChangeText={setFamilyName} />
            <TouchableOpacity style={styles.button} onPress={createFamily}>
              <Text style={styles.buttonText}>Créer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCreateModalVisible(false)}>
              <Text style={{ color: "white" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal modifier famille */}
      <Modal visible={editFamilyModalVisible} transparent animationType="fade">
        <View style={styles.popup}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier la Famille</Text>
            <TextInput style={styles.input} value={familyName} onChangeText={setFamilyName} />
            <TouchableOpacity style={styles.button} onPress={updateFamilyName}>
              <Text style={styles.buttonText}>Sauvegarder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setEditFamilyModalVisible(false)}>
              <Text style={{ color: "white" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal rejoindre famille */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <View style={styles.popup}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejoindre une Famille</Text>
            <TextInput style={styles.input} placeholder="Code famille" value={joinCode} onChangeText={setJoinCode} keyboardType="numeric" />
            <TouchableOpacity style={styles.button} onPress={joinFamily}>
              <Text style={styles.buttonText}>Rejoindre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setJoinModalVisible(false)}>
              <Text style={{ color: "white" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "#00d0ff", padding: 12, borderRadius: 12, marginTop: 10 },
  buttonSecondary: { backgroundColor: "#0066cc", padding: 12, borderRadius: 12, marginTop: 10 },
  buttonText: { color: "white", textAlign: "center", fontSize: 16 },
  familyRow: { flexDirection: "row", alignItems: "center", marginBottom: 15, backgroundColor: "#f4f4f4", padding: 10, borderRadius: 10 },
  familyText: { fontSize: 18, flex: 1 },
  popup: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "white", padding: 25, borderRadius: 20, width: "85%", maxHeight: "80%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#00d0ff", padding: 12, borderRadius: 12, marginBottom: 15 },
  closeBtn: { backgroundColor: "red", padding: 12, borderRadius: 12, marginTop: 10, alignItems: "center" },
  memberRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: "#e7f3ff", borderRadius: 12, marginVertical: 5 },
});
