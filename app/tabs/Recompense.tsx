import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, increment, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { auth, db } from "../../firebaseConfig";

export default function Recompense() {
  const [points, setPoints] = useState(0);
  const [selectedType, setSelectedType] = useState<"personal" | "family">("personal");
  const [familiesJoined, setFamiliesJoined] = useState<{ id: string; name: string }[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<{ id: string; name: string } | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [rewardName, setRewardName] = useState("");
  const [rewardPoints, setRewardPoints] = useState("");
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Charger l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setEmail(user.email || null);
      } else {
        setUid(null);
        setEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Charger les familles de l'utilisateur
  useEffect(() => {
    if (!email) return;

    const q = query(collection(db, "families"), where("members", "array-contains", email));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setFamiliesJoined(list);
    });

    return () => unsubscribe();
  }, [email]);

  // Charger les points
  useEffect(() => {
    if (!uid) return;

    let unsubscribe: any;

    if (selectedType === "personal") {
      // Points personnels depuis le document utilisateur
      const userDocRef = doc(db, "users", uid);
      unsubscribe = onSnapshot(userDocRef, (snapshot) => {
        const data = snapshot.data();
        setPoints(data?.points || 0);
      });
    } else if (selectedType === "family" && selectedFamily) {
      // Points dans la famille - stockés dans families/{familyId}/members/{uid}
      const memberDocRef = doc(db, "families", selectedFamily.id, "members", uid);
      unsubscribe = onSnapshot(memberDocRef, (snapshot) => {
        const data = snapshot.data();
        setPoints(data?.points || 0);
      });
    }

    return () => unsubscribe && unsubscribe();
  }, [uid, selectedType, selectedFamily]);

  // Charger les récompenses
  useEffect(() => {
    if (!uid) return;

    let unsubscribe: any;

    if (selectedType === "personal") {
      // Récompenses personnelles
      const rewardsCollection = collection(db, "users", uid, "rewards");
      unsubscribe = onSnapshot(rewardsCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setRewards(list.sort((a, b) => a.pointsRequired - b.pointsRequired));
      });
    } else if (selectedType === "family" && selectedFamily) {
      // Récompenses familiales
      const rewardsCollection = collection(db, "families", selectedFamily.id, "rewards");
      unsubscribe = onSnapshot(rewardsCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setRewards(list.sort((a, b) => a.pointsRequired - b.pointsRequired));
      });
    }

    return () => unsubscribe && unsubscribe();
  }, [uid, selectedType, selectedFamily]);

  // Charger les membres de la famille
  useEffect(() => {
    if (selectedType !== "family" || !selectedFamily) {
      setFamilyMembers([]);
      setSelectedMember(null);
      return;
    }

    const unsubscribes: any[] = [];

    // Charger les membres de la famille
    const familyDocRef = doc(db, "families", selectedFamily.id);
    const unsubFamily = onSnapshot(familyDocRef, async (snapshot) => {
      const familyData = snapshot.data();
      if (!familyData || !familyData.members) return;

      const loadedMembers: any[] = [];

      for (const memberEmail of familyData.members) {
        // Récupérer les infos de l'utilisateur
        const usersQuery = query(collection(db, "users"), where("email", "==", memberEmail));
        const usersSnapshot = await onSnapshot(usersQuery, (userSnap) => {
          userSnap.forEach(async (userDoc) => {
            const userData = userDoc.data();
            const memberUid = userDoc.id;

            const memberInfo = {
              uid: memberUid,
              email: memberEmail,
              firstName: userData.firstName || userData.prenom || userData.name || "Prénom",
              lastName: userData.lastName || userData.nom || ""
            };

            setFamilyMembers((prev) => {
              const filtered = prev.filter(m => m.uid !== memberUid);
              return [...filtered, memberInfo];
            });
          });
        });

        unsubscribes.push(usersSnapshot);
      }
    });

    unsubscribes.push(unsubFamily);

    return () => {
      unsubscribes.forEach(unsub => unsub && unsub());
    };
  }, [selectedType, selectedFamily]);

  // Charger les points du membre sélectionné
  useEffect(() => {
    if (!selectedMember || !selectedFamily) return;

    const memberDocRef = doc(db, "families", selectedFamily.id, "members", selectedMember.uid);
    const unsubscribe = onSnapshot(memberDocRef, (snapshot) => {
      const data = snapshot.data();
      setPoints(data?.points || 0);
    });

    return () => unsubscribe();
  }, [selectedMember, selectedFamily]);

  // Charger les récompenses du membre sélectionné (quand en mode famille avec membre sélectionné)
  useEffect(() => {
    if (selectedType !== "family" || !selectedFamily || !selectedMember) return;

    // Charger les récompenses de la famille filtrées par membre
    const rewardsCollection = collection(db, "families", selectedFamily.id, "rewards");
    const unsubscribe = onSnapshot(rewardsCollection, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Afficher les récompenses assignées à ce membre OU les récompenses communes (sans assignedTo)
        if (!data.assignedTo || data.assignedTo === selectedMember.uid) {
          list.push({ id: doc.id, ...data });
        }
      });
      setRewards(list.sort((a, b) => a.pointsRequired - b.pointsRequired));
    });

    return () => unsubscribe();
  }, [selectedType, selectedFamily, selectedMember]);

  // Ajouter une récompense
  const addReward = async () => {
    if (!uid || !rewardName.trim() || !rewardPoints.trim()) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const pointsNum = parseInt(rewardPoints);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      alert("Le nombre de points doit être un nombre positif");
      return;
    }

    try {
      let rewardsCollection;
      if (selectedType === "personal") {
        rewardsCollection = collection(db, "users", uid, "rewards");
      } else if (selectedFamily) {
        rewardsCollection = collection(db, "families", selectedFamily.id, "rewards");
      } else {
        return;
      }

      const rewardData: any = {
        name: rewardName,
        pointsRequired: pointsNum,
        createdAt: new Date().toISOString()
      };

      // Si on est en mode famille avec un membre sélectionné, assigner la récompense à ce membre
      if (selectedType === "family" && selectedMember) {
        rewardData.assignedTo = selectedMember.uid;
        rewardData.assignedToName = `${selectedMember.firstName} ${selectedMember.lastName}`;
      }

      await addDoc(rewardsCollection, rewardData);

      setRewardName("");
      setRewardPoints("");
      setModalVisible(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la récompense:", error);
      alert("Erreur lors de l'ajout de la récompense");
    }
  };

  // Supprimer une récompense
  const deleteReward = async (rewardId: string) => {
    if (!uid) return;

    try {
      let rewardDoc;
      if (selectedType === "personal") {
        rewardDoc = doc(db, "users", uid, "rewards", rewardId);
      } else if (selectedFamily) {
        rewardDoc = doc(db, "families", selectedFamily.id, "rewards", rewardId);
      } else {
        return;
      }

      await deleteDoc(rewardDoc);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Réclamer une récompense
  const claimReward = async (reward: any) => {
    if (!selectedMember && selectedType === "family") {
      alert("Erreur: Aucun membre sélectionné");
      return;
    }

    const targetUserId = selectedType === "personal" ? uid : selectedMember?.uid;
    if (!targetUserId) return;

    // Vérifier si l'utilisateur a assez de points
    if (points < reward.pointsRequired) {
      alert("Pas assez de points pour cette récompense !");
      return;
    }

    const confirmClaim = window.confirm(
      `Voulez-vous réclamer "${reward.name}" pour ${reward.pointsRequired} points ?`
    );

    if (!confirmClaim) return;

    try {
      // Retirer les points
      if (selectedType === "personal") {
        const userDocRef = doc(db, "users", targetUserId);
        await updateDoc(userDocRef, {
          points: increment(-reward.pointsRequired)
        });
      } else if (selectedFamily) {
        const memberDocRef = doc(db, "families", selectedFamily.id, "members", targetUserId);
        await updateDoc(memberDocRef, {
          points: increment(-reward.pointsRequired)
        });
      }

      alert(`🎉 Récompense "${reward.name}" réclamée ! ${reward.pointsRequired} points retirés.`);
    } catch (error) {
      console.error("Erreur lors de la réclamation:", error);
      alert("Erreur lors de la réclamation de la récompense");
    }
  };

  // Calculer le pourcentage du cercle (max 1000 points = 100%)
  const maxPoints = 1000;
  const progress = Math.min(points / maxPoints, 1);
  
  // Paramètres du cercle
  const size = 250;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Récompenses</Text>

      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ alignItems: "center", paddingBottom: 20 }}>
        {/* Sélecteur Personnel / Famille */}
        <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedType === "personal" ? "personal" : selectedFamily?.id}
          onValueChange={(value) => {
            if (value === "personal") {
              setSelectedType("personal");
              setSelectedFamily(null);
            } else {
              const fam = familiesJoined.find(f => f.id === value);
              if (fam) {
                setSelectedFamily(fam);
                setSelectedType("family");
              }
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="Mes points personnels" value="personal" />
          <Picker.Item label="--- Familles ---" value="" enabled={false} />
          {familiesJoined.map(f => (
            <Picker.Item key={f.id} label={`Points ${f.name}`} value={f.id} />
          ))}
        </Picker>
      </View>

      {/* Sélecteur de membre (uniquement en mode famille) */}
      {selectedType === "family" && selectedFamily && familyMembers.length > 0 && (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMember?.uid || ""}
            onValueChange={(value) => {
              if (value) {
                const member = familyMembers.find(m => m.uid === value);
                setSelectedMember(member || null);
              } else {
                setSelectedMember(null);
              }
            }}
            style={styles.picker}
          >
            <Picker.Item label="Sélectionnez un membre" value="" />
            {familyMembers.map(member => (
              <Picker.Item 
                key={member.uid} 
                label={`${member.firstName} ${member.lastName}${member.uid === uid ? " (Vous)" : ""}`} 
                value={member.uid} 
              />
            ))}
          </Picker>
        </View>
      )}

      {/* Afficher les infos uniquement si un membre est sélectionné en mode famille */}
      {((selectedType === "personal") || (selectedType === "family" && selectedMember)) && (
        <>
      {/* Cercle de progression */}
      <View style={styles.circleContainer}>
        <Svg width={size} height={size}>
          {/* Cercle de fond (gris) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Cercle de progression (jaune) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ffbf00"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        
        {/* Points au centre */}
        <View style={styles.pointsCenter}>
          <Ionicons name="heart" size={60} color="#ff4d6d" />
          <Text style={styles.pointsText}>{points}</Text>
          <Text style={styles.maxPointsText}>/ {maxPoints}</Text>
        </View>
      </View>

      {/* Section des récompenses */}
      <View style={styles.rewardsSection}>
        <View style={styles.rewardHeader}>
          <Text style={styles.rewardsTitle}> Récompenses disponibles</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color="#ffbf00" />
          </TouchableOpacity>
        </View>

        {rewards.length === 0 ? (
          <Text style={styles.emptyText}>Aucune récompense définie. Ajoutez-en une !</Text>
        ) : (
          rewards.map((item) => (
            <View key={item.id} style={[
              styles.rewardItem,
              points >= item.pointsRequired && styles.rewardItemUnlocked
            ]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardName}>
                  {points >= item.pointsRequired && "✅ "}
                  {item.name}
                </Text>
                <Text style={styles.rewardPointsText}>
                  {item.pointsRequired} points requis
                </Text>
                {item.assignedToName && (
                  <Text style={styles.assignedToText}>
                    👤 Pour: {item.assignedToName}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {points >= item.pointsRequired && (
                  <TouchableOpacity 
                    onPress={() => claimReward(item)}
                    style={styles.claimButton}
                  >
                    <Text style={styles.claimButtonText}>Réclamer</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deleteReward(item.id)}>
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      </>
      )}
      </ScrollView>

      {/* Modal pour ajouter une récompense */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une récompense</Text>

            <Text style={styles.label}>Nom de la récompense</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Sortie au cinéma"
              value={rewardName}
              onChangeText={setRewardName}
            />

            <Text style={styles.label}>Nombre de points requis</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 100"
              keyboardType="numeric"
              value={rewardPoints}
              onChangeText={setRewardPoints}
            />

            {selectedType === "family" && selectedMember && (
              <Text style={styles.infoModalText}>
                💡 Cette récompense sera assignée à {selectedMember.firstName} {selectedMember.lastName}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setModalVisible(false);
                  setRewardName("");
                  setRewardPoints("");
                }}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addReward}
              >
                <Text style={styles.buttonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "white", 
    alignItems: "center", 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 20 
  },
  pickerContainer: { 
    width: "100%", 
    marginBottom: 30 
  },
  picker: { 
    backgroundColor: "#f0f0f0", 
    borderRadius: 10 
  },
  circleContainer: { 
    position: "relative", 
    alignItems: "center", 
    justifyContent: "center", 
    marginVertical: 30 
  },
  pointsCenter: { 
    position: "absolute", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  pointsText: { 
    fontSize: 48, 
    fontWeight: "bold", 
    color: "#333" 
  },
  maxPointsText: { 
    fontSize: 18, 
    color: "#666" 
  },
  infoContainer: { 
    padding: 20, 
    backgroundColor: "#f9f9f9", 
    borderRadius: 10, 
    marginTop: 20,
    width: "100%"
  },
  infoText: { 
    fontSize: 16, 
    textAlign: "center", 
    color: "#333" 
  },
  rewardsSection: {
    width: "100%",
    marginTop: 30
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333"
  },
  addButton: {
    padding: 5
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ccc"
  },
  rewardItemUnlocked: {
    backgroundColor: "#e8f5e9",
    borderLeftColor: "#4CAF50"
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5
  },
  rewardPointsText: {
    fontSize: 14,
    color: "#666"
  },
  assignedToText: {
    fontSize: 12,
    color: "#ffbf00",
    fontWeight: "600",
    marginTop: 4
  },
  claimButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  claimButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold"
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 15,
    width: "85%",
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333"
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
    marginTop: 10
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  infoModalText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 15,
    textAlign: "center",
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 8
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    gap: 10
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center"
  },
  cancelButton: {
    backgroundColor: "#757575"
  },
  saveButton: {
    backgroundColor: "#ffbf00"
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  }
});