import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebaseConfig";

type Family = {
  id: string;
  name?: string;
  members?: string[];
};

type Contact = { name: string; phone: string };

type Document = { name: string; url: string };

type Member = {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  birthday?: string;
  photo?: string;

  // Médecin
  doctorName?: string;
  doctorPhone?: string;
  doctorAddress?: string;

  // Infos médicales
  bloodGroup?: string;
  allergies?: string[];
  geneticDiseases?: string[];
  nationalNumber?: string;
  emergencyContacts?: Contact[];

  // École
  schoolName?: string;
  schoolPhone?: string;
  schoolAddress?: string;

  // Activités
  activityContacts?: Contact[];

  // Famille
  familyContacts?: Contact[];

  // Couleur
  color?: string;

  // Documents
  documents?: Document[];
};

export default function FamilyJournal() {
  const [email, setEmail] = useState<string | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(true);

  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
 

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  

  const [editMode, setEditMode] = useState(false);

  const [membersModalVisible, setMembersModalVisible] = useState(false); // liste des membres
const [memberDetailModalVisible, setMemberDetailModalVisible] = useState(false); // détail membre


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email || null);
    });
    return () => unsub();
  }, []);

  // Charger les familles
  useEffect(() => {
    if (!email) return setLoadingFamilies(false);

    setLoadingFamilies(true);
    const q = query(collection(db, "families"), where("members", "array-contains", email));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const list: Family[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setFamilies(list);
        setLoadingFamilies(false);
      },
      err => {
        console.error(err);
        setLoadingFamilies(false);
      }
    );
    return () => unsub();
  }, [email]);

  // Ouvrir modal membres
  const openMembersModal = (family: Family) => {
    setSelectedFamily(family);
    const memList: Member[] = (family.members || []).map(email => ({ id: email, name: email }));
    setMembers(memList);
    setMembersModalVisible(true);
  };

  const closeMemberDetailModal = () => {
  setSelectedMember(null);
  setMemberDetailModalVisible(false);
};

 const closeMemberModal = () => {
    setSelectedMember(null);
    setMemberDetailModalVisible(false);
  };


  const closeMembersModal = () => {
    setMembersModalVisible(false);
    setSelectedFamily(null);
    setMembers([]);
  };

  // Ouvrir modal détail membre
  const openMemberDetail = async (member: Member) => {
  try {
    const docRef = doc(db, "users", member.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setSelectedMember({ id: member.id, ...docSnap.data() });
    } else {
      setSelectedMember(member);
    }
  } catch (err) {
    console.error(err);
    setSelectedMember(member);
  }
  setMemberDetailModalVisible(true);
};


 

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>Carnet familial</Text>

      {loadingFamilies ? <ActivityIndicator /> : null}

      {!loadingFamilies && families.length === 0 ? (
        <Text>Aucune famille trouvée.</Text>
      ) : (
        <FlatList
          data={families}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.familyCard} onPress={() => openMembersModal(item)}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="people" size={22} color="#333" />
                <Text style={styles.familyName}>{item.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal Membres */}
      <Modal visible={membersModalVisible} transparent animationType="fade">
  <View style={styles.modalBackground}>
    <View style={styles.modalContent}>
      
      {/* HEADER */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{selectedFamily?.name}</Text>
        <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
        <View style={{ flexDirection: 'row', marginLeft: 'auto', alignItems: 'center' }}>
          <TouchableOpacity onPress={closeMembersModal}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
            <ScrollView>
              {members.map((m) => (
                <TouchableOpacity key={m.id} style={styles.memberRow} onPress={() => openMemberDetail(m)}>
                  <Text>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
           
          </View>
        </View>



      </Modal>

      {/* Modal détail membre */}
      <Modal visible={memberDetailModalVisible} transparent animationType="fade">
  <View style={styles.modalBackground}>
    <View style={styles.modalContent}>
      
      {/* Header avec nom, bouton fermer à droite et engrenage */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
        
        <View style={{ flexDirection: "row", marginLeft: "auto", alignItems: "center" }}>
          {!editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)} style={{ marginRight: 10 }}>
              <Ionicons name="settings" size={22} color="#333" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={closeMemberDetailModal}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
          <ScrollView style={{ marginTop: 10 }}>
        {/* PHOTO */}
        {selectedMember?.photo ? (
          <Image source={{ uri: selectedMember.photo }} style={styles.profilePhoto} />
        ) : (
          <View style={[styles.profilePhoto, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
        )}

        {/* INFOS DE BASE */}
        <Text style={styles.sectionTitle}>Infos de base</Text>
        <TextInput
          style={[styles.input, !editMode && styles.inputDisabled]}
          placeholder="Nom"
          value={selectedMember?.name}
          editable={editMode}
          onChangeText={(text) => setSelectedMember({ ...selectedMember!, name: text })}
        />

        <Text style={{ marginBottom: 5 }}>Rôle</Text>
        <Picker
          enabled={editMode}
          selectedValue={selectedMember?.role || "Enfant"}
          onValueChange={(val) => setSelectedMember({ ...selectedMember!, role: val })}
          style={styles.picker}
        >
          <Picker.Item label="Parent" value="Parent" />
          <Picker.Item label="Enfant" value="Enfant" />
        </Picker>

        <TextInput
          style={[styles.input, !editMode && styles.inputDisabled]}
          placeholder="Téléphone"
          value={selectedMember?.phone}
          editable={editMode}
          onChangeText={(text) => setSelectedMember({ ...selectedMember!, phone: text })}
        />

            <TextInput placeholder="Anniversaire" value={selectedMember?.birthday} onChangeText={(text) => setSelectedMember({ ...selectedMember!, birthday: text })} style={styles.input} />
            <TextInput placeholder="Groupe sanguin" value={selectedMember?.bloodGroup} onChangeText={(text) => setSelectedMember({ ...selectedMember!, bloodGroup: text })} style={styles.input} />
            <TextInput placeholder="Allergies" value={selectedMember?.allergies?.join(", ")} onChangeText={(text) => setSelectedMember({ ...selectedMember!, allergies: text.split(",") })} style={styles.input} />
            <TextInput placeholder="Maladies génétiques" value={selectedMember?.geneticDiseases?.join(", ")} onChangeText={(text) => setSelectedMember({ ...selectedMember!, geneticDiseases: text.split(",") })} style={styles.input} />
            <TextInput placeholder="Numéro national" value={selectedMember?.nationalNumber} onChangeText={(text) => setSelectedMember({ ...selectedMember!, nationalNumber: text })} style={styles.input} />

            {/* Médecin */}
            <Text style={styles.sectionTitle}>Médecin traitant</Text>
            <TextInput placeholder="Nom médecin" value={selectedMember?.doctorName} onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorName: text })} style={styles.input} />
            <TextInput placeholder="Téléphone médecin" value={selectedMember?.doctorPhone} onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorPhone: text })} style={styles.input} />
            <TextInput placeholder="Adresse médecin" value={selectedMember?.doctorAddress} onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorAddress: text })} style={styles.input} />

            {/* École */}
            <Text style={styles.sectionTitle}>École</Text>
            <TextInput placeholder="Nom école" value={selectedMember?.schoolName} onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolName: text })} style={styles.input} />
            <TextInput placeholder="Téléphone école" value={selectedMember?.schoolPhone} onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolPhone: text })} style={styles.input} />
            <TextInput placeholder="Adresse école" value={selectedMember?.schoolAddress} onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolAddress: text })} style={styles.input} />

            {/* Couleur */}
            <Text style={styles.sectionTitle}>Couleur du profil</Text>
            <Picker selectedValue={selectedMember?.color} onValueChange={(val) => setSelectedMember({ ...selectedMember!, color: val })} style={styles.picker}>
              <Picker.Item label="Rouge" value="red" />
              <Picker.Item label="Bleu" value="blue" />
              <Picker.Item label="Vert" value="green" />
              <Picker.Item label="Jaune" value="yellow" />
            </Picker>

            {editMode && (
          <TouchableOpacity
            style={[styles.addBtn, { marginVertical: 10 }]}
            onPress={() => {
              // Ici tu sauvegardes dans Firestore
              setEditMode(false);
            }}
          >
            <Text style={styles.btnText}>Enregistrer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  familyCard: { padding: 14, backgroundColor: "#fff", borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#eee", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  familyName: { fontSize: 16, marginLeft: 10, fontWeight: "600" },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  inputDisabled: {
    backgroundColor: '#eee',
    color: '#555',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  memberRow: {
  paddingVertical: 12,
  paddingHorizontal: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff',
  borderRadius: 8,
  marginBottom: 5,
},
});



