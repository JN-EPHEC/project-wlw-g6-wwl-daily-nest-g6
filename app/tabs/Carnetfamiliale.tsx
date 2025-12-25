import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { onAuthStateChanged } from "firebase/auth";
<<<<<<< HEAD
<<<<<<< HEAD
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
=======
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
>>>>>>> 6d82195 (Carnet familiale)
=======
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
  members?: string[] | Array<{email: string; role: string}>; // Support ancien format et nouveau
=======
  members?: string[];
>>>>>>> 6d82195 (Carnet familiale)
=======
  members?: string[] | Array<{email: string; role: string}>; // Support ancien format et nouveau
>>>>>>> 4304248 (les rôles)
};

type Contact = { name: string; phone: string };

type Document = { name: string; url: string };

type Member = {
  id: string;
  name?: string;
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  birthday?: string;
  birthDate?: string;
  gender?: string;
<<<<<<< HEAD
=======
  role?: string;
  phone?: string;
  birthday?: string;
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
  photo?: string;

  // Médecin
  doctorName?: string;
  doctorPhone?: string;
  doctorAddress?: string;

  // Infos médicales
  bloodGroup?: string;
<<<<<<< HEAD
<<<<<<< HEAD
  allergies?: string[] | string;
  geneticDiseases?: string[] | string;
=======
  allergies?: string[];
  geneticDiseases?: string[];
>>>>>>> 6d82195 (Carnet familiale)
=======
  allergies?: string[] | string;
  geneticDiseases?: string[] | string;
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
  const [editMode, setEditMode] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  const [membersModalVisible, setMembersModalVisible] = useState(false); // liste des membres
  const [memberDetailModalVisible, setMemberDetailModalVisible] = useState(false); // détail membre
  const [roleManagementVisible, setRoleManagementVisible] = useState(false); // gestion des rôles
  const [roleAssignments, setRoleAssignments] = useState<{[email: string]: string}>({}); // email -> role
=======
  

=======
>>>>>>> 4304248 (les rôles)
  const [editMode, setEditMode] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  const [membersModalVisible, setMembersModalVisible] = useState(false); // liste des membres
<<<<<<< HEAD
const [memberDetailModalVisible, setMemberDetailModalVisible] = useState(false); // détail membre
>>>>>>> 6d82195 (Carnet familiale)
=======
  const [memberDetailModalVisible, setMemberDetailModalVisible] = useState(false); // détail membre
  const [roleManagementVisible, setRoleManagementVisible] = useState(false); // gestion des rôles
  const [roleAssignments, setRoleAssignments] = useState<{[email: string]: string}>({}); // email -> role
>>>>>>> 4304248 (les rôles)


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
<<<<<<< HEAD
    // Charger TOUTES les familles et filtrer côté client (pour supporter les deux formats)
    const q = query(collection(db, "families"));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const allFamilies: Family[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        // Filtrer pour ne garder que les familles où l'utilisateur est membre
        const userFamilies = allFamilies.filter(family => {
          const members = family.members || [];
          
          for (const memberItem of members) {
            if (typeof memberItem === 'string' && memberItem === email) {
              return true; // Format ancien
            } else if (typeof memberItem === 'object' && memberItem.email === email) {
              return true; // Format nouveau
            }
          }
          return false;
        });
        
        setFamilies(userFamilies);
=======
    const q = query(collection(db, "families"), where("members", "array-contains", email));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const list: Family[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setFamilies(list);
>>>>>>> 6d82195 (Carnet familiale)
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
<<<<<<< HEAD
<<<<<<< HEAD
  const openMembersModal = async (family: Family) => {
    setSelectedFamily(family);
    
    // Charger les détails des membres depuis Firestore
    const memList: Member[] = [];
    const familyMembers = family.members || [];
    
    for (const memberItem of familyMembers) {
      // Support des deux formats: string (ancien) ou {email, role} (nouveau)
      const memberEmail = typeof memberItem === 'string' ? memberItem : memberItem.email;
      const memberRole = typeof memberItem === 'string' ? undefined : memberItem.role;
      
      try {
        // Trouver l'utilisateur par email
        const usersQuery = query(collection(db, "users"), where("email", "==", memberEmail));
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          usersSnapshot.forEach(doc => {
            const userData = doc.data();
            memList.push({
              id: doc.id, // UID
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || memberEmail,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: memberRole, // Rôle depuis la famille
            });
          });
        } else {
          // Si l'utilisateur n'est pas trouvé, ajouter l'email comme fallback
          memList.push({ id: memberEmail, name: memberEmail, role: memberRole });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des membres:', err);
        memList.push({ id: memberEmail, name: memberEmail, role: memberRole });
      }
    }
    
=======
  const openMembersModal = (family: Family) => {
    setSelectedFamily(family);
    const memList: Member[] = (family.members || []).map(email => ({ id: email, name: email }));
>>>>>>> 6d82195 (Carnet familiale)
=======
  const openMembersModal = async (family: Family) => {
    setSelectedFamily(family);
    
    // Charger les détails des membres depuis Firestore
    const memList: Member[] = [];
    const familyMembers = family.members || [];
    
    for (const memberItem of familyMembers) {
      // Support des deux formats: string (ancien) ou {email, role} (nouveau)
      const memberEmail = typeof memberItem === 'string' ? memberItem : memberItem.email;
      const memberRole = typeof memberItem === 'string' ? undefined : memberItem.role;
      
      try {
        // Trouver l'utilisateur par email
        const usersQuery = query(collection(db, "users"), where("email", "==", memberEmail));
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          usersSnapshot.forEach(doc => {
            const userData = doc.data();
            memList.push({
              id: doc.id, // UID
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || memberEmail,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: memberRole, // Rôle depuis la famille
            });
          });
        } else {
          // Si l'utilisateur n'est pas trouvé, ajouter l'email comme fallback
          memList.push({ id: memberEmail, name: memberEmail, role: memberRole });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des membres:', err);
        memList.push({ id: memberEmail, name: memberEmail, role: memberRole });
      }
    }
    
>>>>>>> 4304248 (les rôles)
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

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
  // Ouvrir le modal de gestion des rôles
  const openRoleManagement = () => {
    if (!selectedFamily) return;
    
    // Initialiser les rôles actuels
    const currentRoles: {[email: string]: string} = {};
    const familyMembers = selectedFamily.members || [];
    
    for (const memberItem of familyMembers) {
      if (typeof memberItem === 'string') {
        currentRoles[memberItem] = 'Enfant'; // Rôle par défaut
      } else {
        currentRoles[memberItem.email] = memberItem.role || 'Enfant';
      }
    }
    
    setRoleAssignments(currentRoles);
    setRoleManagementVisible(true);
  };

  // Sauvegarder les rôles dans Firestore
  const saveRoles = async () => {
    if (!selectedFamily) return;
    
    try {
      // Convertir en nouveau format
      const newMembers = Object.entries(roleAssignments).map(([email, role]) => ({
        email,
        role
      }));
      
      await setDoc(doc(db, 'families', selectedFamily.id), {
        members: newMembers
      }, { merge: true });
      
      Alert.alert('Succès', 'Les rôles ont été mis à jour!');
      setRoleManagementVisible(false);
      
      // Recharger la famille
      const familyDoc = await getDoc(doc(db, 'families', selectedFamily.id));
      if (familyDoc.exists()) {
        setSelectedFamily({ id: selectedFamily.id, ...familyDoc.data() });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des rôles:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les rôles');
    }
  };

  // Sauvegarder les modifications d'un enfant par un parent
  const handleSaveMemberInfo = async () => {
    if (!selectedMember) return;
    
    try {
      await setDoc(doc(db, 'users', selectedMember.id), {
        firstName: selectedMember.firstName || '',
        lastName: selectedMember.lastName || '',
        birthDate: selectedMember.birthDate || '',
        gender: selectedMember.gender || '',
        phone: selectedMember.phone || '',
        bloodGroup: selectedMember.bloodGroup || '',
        allergies: selectedMember.allergies || '',
        geneticDiseases: selectedMember.geneticDiseases || '',
        nationalNumber: selectedMember.nationalNumber || '',
        doctorName: selectedMember.doctorName || '',
        doctorPhone: selectedMember.doctorPhone || '',
        doctorAddress: selectedMember.doctorAddress || '',
        schoolName: selectedMember.schoolName || '',
        schoolPhone: selectedMember.schoolPhone || '',
        schoolAddress: selectedMember.schoolAddress || '',
        role: selectedMember.role || 'Enfant',
      }, { merge: true });
      
      Alert.alert('Succès', 'Les informations ont été mises à jour!');
      setEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
  };

<<<<<<< HEAD
=======
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
  // Ouvrir modal détail membre
  const openMemberDetail = async (member: Member) => {
  try {
    const docRef = doc(db, "users", member.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
      const memberData = docSnap.data();
      setSelectedMember({ id: member.id, ...memberData, role: member.role }); // Utiliser le rôle depuis la famille
      console.log('📋 Membre sélectionné:', memberData.firstName, memberData.lastName);
      console.log('👶 Rôle du membre (depuis la famille):', member.role);
<<<<<<< HEAD
    } else {
      setSelectedMember(member);
      console.log('⚠️ Membre non trouvé dans Firestore');
    }
    
    // Récupérer le rôle de l'utilisateur connecté DANS CETTE FAMILLE
    const currentUser = auth.currentUser;
    if (currentUser && selectedFamily) {
      const familyMembers = selectedFamily.members || [];
      
      // Trouver le rôle de l'utilisateur connecté dans cette famille
      let userRole = null;
      for (const memberItem of familyMembers) {
        const memberEmail = typeof memberItem === 'string' ? memberItem : memberItem.email;
        if (memberEmail === currentUser.email) {
          userRole = typeof memberItem === 'string' ? null : memberItem.role;
          break;
        }
      }
      
      setCurrentUserRole(userRole);
      console.log('👤 Rôle utilisateur connecté (dans cette famille):', userRole);
      console.log('✅ Peut éditer?', userRole?.toLowerCase() === 'parent' && member.role?.toLowerCase() === 'enfant');
    }
  } catch (err) {
    console.error('❌ Erreur dans openMemberDetail:', err);
    setSelectedMember(member);
  }
  setEditMode(false);
=======
      setSelectedMember({ id: member.id, ...docSnap.data() });
=======
>>>>>>> 4304248 (les rôles)
    } else {
      setSelectedMember(member);
      console.log('⚠️ Membre non trouvé dans Firestore');
    }
    
    // Récupérer le rôle de l'utilisateur connecté DANS CETTE FAMILLE
    const currentUser = auth.currentUser;
    if (currentUser && selectedFamily) {
      const familyMembers = selectedFamily.members || [];
      
      // Trouver le rôle de l'utilisateur connecté dans cette famille
      let userRole = null;
      for (const memberItem of familyMembers) {
        const memberEmail = typeof memberItem === 'string' ? memberItem : memberItem.email;
        if (memberEmail === currentUser.email) {
          userRole = typeof memberItem === 'string' ? null : memberItem.role;
          break;
        }
      }
      
      setCurrentUserRole(userRole);
      console.log('👤 Rôle utilisateur connecté (dans cette famille):', userRole);
      console.log('✅ Peut éditer?', userRole?.toLowerCase() === 'parent' && member.role?.toLowerCase() === 'enfant');
    }
  } catch (err) {
    console.error('❌ Erreur dans openMemberDetail:', err);
    setSelectedMember(member);
  }
<<<<<<< HEAD
>>>>>>> 6d82195 (Carnet familiale)
=======
  setEditMode(false);
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
        <View style={{ flexDirection: 'row', marginLeft: 'auto', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={openRoleManagement}>
            <Ionicons name="people-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
<<<<<<< HEAD
=======
        <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
        <View style={{ flexDirection: 'row', marginLeft: 'auto', alignItems: 'center' }}>
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
          <TouchableOpacity onPress={closeMembersModal}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
            <ScrollView>
              {members.map((m) => (
                <TouchableOpacity key={m.id} style={styles.memberRow} onPress={() => openMemberDetail(m)}>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons 
                      name={m.role?.toLowerCase() === 'parent' ? 'person' : 'person-outline'} 
                      size={24} 
                      color={m.role?.toLowerCase() === 'parent' ? '#2196F3' : '#FF9800'} 
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500' }}>{m.name}</Text>
                      {m.role && (
                        <View style={[
                          styles.roleBadge, 
                          { backgroundColor: m.role.toLowerCase() === 'parent' ? '#E3F2FD' : '#FFF3E0' }
                        ]}>
                          <Text style={[
                            styles.roleText,
                            { color: m.role.toLowerCase() === 'parent' ? '#1976D2' : '#F57C00' }
                          ]}>
                            {m.role}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
<<<<<<< HEAD
=======
                  <Text>{m.name}</Text>
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
        <Text style={styles.modalTitle}>{selectedMember?.firstName} {selectedMember?.lastName}</Text>
        
        <View style={{ flexDirection: "row", marginLeft: "auto", alignItems: "center", gap: 10 }}>
          {/* Bouton d'édition visible seulement si: utilisateur = parent ET membre = enfant */}
          {currentUserRole?.toLowerCase() === 'parent' && selectedMember?.role?.toLowerCase() === 'enfant' && (
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
              <Ionicons name={editMode ? "checkmark" : "pencil"} size={22} color="#ff9500" />
=======
        <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
        
        <View style={{ flexDirection: "row", marginLeft: "auto", alignItems: "center" }}>
          {!editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)} style={{ marginRight: 10 }}>
              <Ionicons name="settings" size={22} color="#333" />
>>>>>>> 6d82195 (Carnet familiale)
=======
        <Text style={styles.modalTitle}>{selectedMember?.firstName} {selectedMember?.lastName}</Text>
        
        <View style={{ flexDirection: "row", marginLeft: "auto", alignItems: "center", gap: 10 }}>
          {/* Bouton d'édition visible seulement si: utilisateur = parent ET membre = enfant */}
          {currentUserRole?.toLowerCase() === 'parent' && selectedMember?.role?.toLowerCase() === 'enfant' && (
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
              <Ionicons name={editMode ? "checkmark" : "pencil"} size={22} color="#ff9500" />
>>>>>>> 4304248 (les rôles)
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={closeMemberDetailModal}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
      
      {/* Message informatif */}
      {currentUserRole?.toLowerCase() === 'parent' && selectedMember?.role?.toLowerCase() === 'enfant' ? (
        <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="information-circle" size={24} color="#F57C00" style={{ marginRight: 10 }} />
          <Text style={{ flex: 1, color: '#E65100', fontSize: 13 }}>
            En tant que parent, vous pouvez modifier les informations de cet enfant.
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, marginVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="information-circle" size={24} color="#2196F3" style={{ marginRight: 10 }} />
          <Text style={{ flex: 1, color: '#1976D2', fontSize: 13 }}>
            Ces informations sont en lecture seule. Chaque membre peut les modifier dans son propre profil.
          </Text>
        </View>
      )}

<<<<<<< HEAD
=======
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
        
        <Text style={styles.label}>Prénom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.firstName || ''}
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, firstName: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.firstName || 'Non renseigné'}</Text>
        )}
<<<<<<< HEAD

        <Text style={styles.label}>Nom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.lastName || ''}
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, lastName: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.lastName || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Rôle</Text>
        {editMode ? (
          <Picker
            selectedValue={selectedMember?.role || 'Enfant'}
            onValueChange={(val) => setSelectedMember({ ...selectedMember!, role: val })}
            style={styles.picker}
          >
            <Picker.Item label="Parent" value="Parent" />
            <Picker.Item label="Enfant" value="Enfant" />
          </Picker>
        ) : (
          <Text style={styles.value}>{selectedMember?.role || 'Enfant'}</Text>
        )}

        <Text style={styles.label}>Genre</Text>
        {editMode ? (
          <Picker
            selectedValue={selectedMember?.gender || ''}
            onValueChange={(val) => setSelectedMember({ ...selectedMember!, gender: val })}
            style={styles.picker}
          >
            <Picker.Item label="Non spécifié" value="" />
            <Picker.Item label="Homme" value="homme" />
            <Picker.Item label="Femme" value="femme" />
            <Picker.Item label="Autre" value="autre" />
          </Picker>
        ) : (
          <Text style={styles.value}>
            {selectedMember?.gender === 'homme' ? 'Homme' : 
             selectedMember?.gender === 'femme' ? 'Femme' : 
             selectedMember?.gender === 'autre' ? 'Autre' : 'Non spécifié'}
          </Text>
        )}

        <Text style={styles.label}>Date de naissance</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.birthDate || ''}
            placeholder="JJ/MM/AAAA"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, birthDate: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.birthDate || 'Non renseignée'}</Text>
        )}

        <Text style={styles.label}>Téléphone</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.phone || ''}
            keyboardType="phone-pad"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, phone: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.phone || 'Non renseigné'}</Text>
        )}

        {/* INFOS MÉDICALES */}
        <Text style={styles.sectionTitle}>📋 Informations médicales</Text>
        
        <Text style={styles.label}>Groupe sanguin</Text>
        {editMode ? (
          <Picker
            selectedValue={selectedMember?.bloodGroup || ''}
            onValueChange={(val) => setSelectedMember({ ...selectedMember!, bloodGroup: val })}
            style={styles.picker}
          >
            <Picker.Item label="Non renseigné" value="" />
            <Picker.Item label="A+" value="A+" />
            <Picker.Item label="A-" value="A-" />
            <Picker.Item label="B+" value="B+" />
            <Picker.Item label="B-" value="B-" />
            <Picker.Item label="AB+" value="AB+" />
            <Picker.Item label="AB-" value="AB-" />
            <Picker.Item label="O+" value="O+" />
            <Picker.Item label="O-" value="O-" />
          </Picker>
        ) : (
          <Text style={styles.value}>{selectedMember?.bloodGroup || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Allergies</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.allergies as string || ''}
            placeholder="Séparer par des virgules"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, allergies: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.allergies || 'Aucune'}</Text>
        )}

        <Text style={styles.label}>Maladies génétiques</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.geneticDiseases as string || ''}
            placeholder="Séparer par des virgules"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, geneticDiseases: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.geneticDiseases || 'Aucune'}</Text>
        )}

        <Text style={styles.label}>Numéro national</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.nationalNumber || ''}
            placeholder="XX.XX.XX-XXX.XX"
            keyboardType="numeric"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, nationalNumber: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.nationalNumber || 'Non renseigné'}</Text>
        )}

        {/* Médecin */}
        <Text style={styles.sectionTitle}>⚕️ Médecin traitant</Text>
        
        <Text style={styles.label}>Nom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.doctorName || ''}
            placeholder="Dr. Dupont"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorName: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.doctorName || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Téléphone</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.doctorPhone || ''}
            placeholder="+32 XXX XX XX XX"
            keyboardType="phone-pad"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorPhone: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.doctorPhone || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Adresse</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.doctorAddress || ''}
            placeholder="Rue, Ville, Code postal"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorAddress: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.doctorAddress || 'Non renseignée'}</Text>
        )}

        {/* École */}
        <Text style={styles.sectionTitle}>🏫 École</Text>
        
        <Text style={styles.label}>Nom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.schoolName || ''}
            placeholder="École primaire..."
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolName: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.schoolName || 'Non renseignée'}</Text>
        )}

        <Text style={styles.label}>Téléphone</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.schoolPhone || ''}
            placeholder="+32 XXX XX XX XX"
            keyboardType="phone-pad"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolPhone: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.schoolPhone || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Adresse</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.schoolAddress || ''}
            placeholder="Rue, Ville, Code postal"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolAddress: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.schoolAddress || 'Non renseignée'}</Text>
        )}

        {/* Bouton de sauvegarde en mode édition */}
        {editMode && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveMemberInfo}
          >
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
=======
        <TextInput
          style={[styles.input, !editMode && styles.inputDisabled]}
          placeholder="Nom"
          value={selectedMember?.name}
          editable={editMode}
          onChangeText={(text) => setSelectedMember({ ...selectedMember!, name: text })}
        />
=======
>>>>>>> 4304248 (les rôles)

        <Text style={styles.label}>Nom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.lastName || ''}
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, lastName: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.lastName || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Rôle</Text>
        {editMode ? (
          <Picker
            selectedValue={selectedMember?.role || 'Enfant'}
            onValueChange={(val) => setSelectedMember({ ...selectedMember!, role: val })}
            style={styles.picker}
          >
<<<<<<< HEAD
            <Text style={styles.btnText}>Enregistrer</Text>
>>>>>>> 6d82195 (Carnet familiale)
=======
            <Picker.Item label="Parent" value="Parent" />
            <Picker.Item label="Enfant" value="Enfant" />
          </Picker>
        ) : (
          <Text style={styles.value}>{selectedMember?.role || 'Enfant'}</Text>
        )}

        <Text style={styles.label}>Genre</Text>
        {editMode ? (
          <Picker
            selectedValue={selectedMember?.gender || ''}
            onValueChange={(val) => setSelectedMember({ ...selectedMember!, gender: val })}
            style={styles.picker}
          >
            <Picker.Item label="Non spécifié" value="" />
            <Picker.Item label="Homme" value="homme" />
            <Picker.Item label="Femme" value="femme" />
            <Picker.Item label="Autre" value="autre" />
          </Picker>
        ) : (
          <Text style={styles.value}>
            {selectedMember?.gender === 'homme' ? 'Homme' : 
             selectedMember?.gender === 'femme' ? 'Femme' : 
             selectedMember?.gender === 'autre' ? 'Autre' : 'Non spécifié'}
          </Text>
        )}

        <Text style={styles.label}>Date de naissance</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.birthDate || ''}
            placeholder="JJ/MM/AAAA"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, birthDate: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.birthDate || 'Non renseignée'}</Text>
        )}

        <Text style={styles.label}>Téléphone</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.phone || ''}
            keyboardType="phone-pad"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, phone: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.phone || 'Non renseigné'}</Text>
        )}

        {/* INFOS MÉDICALES */}
        <Text style={styles.sectionTitle}>📋 Informations médicales</Text>
        
        <Text style={styles.label}>Groupe sanguin</Text>
        {editMode ? (
          <Picker
            selectedValue={selectedMember?.bloodGroup || ''}
            onValueChange={(val) => setSelectedMember({ ...selectedMember!, bloodGroup: val })}
            style={styles.picker}
          >
            <Picker.Item label="Non renseigné" value="" />
            <Picker.Item label="A+" value="A+" />
            <Picker.Item label="A-" value="A-" />
            <Picker.Item label="B+" value="B+" />
            <Picker.Item label="B-" value="B-" />
            <Picker.Item label="AB+" value="AB+" />
            <Picker.Item label="AB-" value="AB-" />
            <Picker.Item label="O+" value="O+" />
            <Picker.Item label="O-" value="O-" />
          </Picker>
        ) : (
          <Text style={styles.value}>{selectedMember?.bloodGroup || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Allergies</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.allergies as string || ''}
            placeholder="Séparer par des virgules"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, allergies: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.allergies || 'Aucune'}</Text>
        )}

        <Text style={styles.label}>Maladies génétiques</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.geneticDiseases as string || ''}
            placeholder="Séparer par des virgules"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, geneticDiseases: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.geneticDiseases || 'Aucune'}</Text>
        )}

        <Text style={styles.label}>Numéro national</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.nationalNumber || ''}
            placeholder="XX.XX.XX-XXX.XX"
            keyboardType="numeric"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, nationalNumber: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.nationalNumber || 'Non renseigné'}</Text>
        )}

        {/* Médecin */}
        <Text style={styles.sectionTitle}>⚕️ Médecin traitant</Text>
        
        <Text style={styles.label}>Nom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.doctorName || ''}
            placeholder="Dr. Dupont"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorName: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.doctorName || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Téléphone</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.doctorPhone || ''}
            placeholder="+32 XXX XX XX XX"
            keyboardType="phone-pad"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorPhone: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.doctorPhone || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Adresse</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.doctorAddress || ''}
            placeholder="Rue, Ville, Code postal"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, doctorAddress: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.doctorAddress || 'Non renseignée'}</Text>
        )}

        {/* École */}
        <Text style={styles.sectionTitle}>🏫 École</Text>
        
        <Text style={styles.label}>Nom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.schoolName || ''}
            placeholder="École primaire..."
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolName: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.schoolName || 'Non renseignée'}</Text>
        )}

        <Text style={styles.label}>Téléphone</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={selectedMember?.schoolPhone || ''}
            placeholder="+32 XXX XX XX XX"
            keyboardType="phone-pad"
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolPhone: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.schoolPhone || 'Non renseigné'}</Text>
        )}

        <Text style={styles.label}>Adresse</Text>
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={selectedMember?.schoolAddress || ''}
            placeholder="Rue, Ville, Code postal"
            multiline
            onChangeText={(text) => setSelectedMember({ ...selectedMember!, schoolAddress: text })}
          />
        ) : (
          <Text style={styles.value}>{selectedMember?.schoolAddress || 'Non renseignée'}</Text>
        )}

        {/* Bouton de sauvegarde en mode édition */}
        {editMode && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveMemberInfo}
          >
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
>>>>>>> 4304248 (les rôles)
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)

      {/* Modal Gestion des Rôles */}
      <Modal visible={roleManagementVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gérer les rôles</Text>
              <TouchableOpacity onPress={() => setRoleManagementVisible(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle" size={24} color="#F57C00" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: '#E65100', fontSize: 13 }}>
                Définissez le rôle de chaque membre dans cette famille.
              </Text>
            </View>

            <ScrollView>
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

            <TouchableOpacity style={styles.saveButton} onPress={saveRoles}>
              <Text style={styles.saveButtonText}>Enregistrer les rôles</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
<<<<<<< HEAD
=======
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 10,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
  },
<<<<<<< HEAD
=======
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
<<<<<<< HEAD
=======
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4304248 (les rôles)
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleRow: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  rolePicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
<<<<<<< HEAD
=======
>>>>>>> 6d82195 (Carnet familiale)
=======
>>>>>>> 4304248 (les rôles)
});