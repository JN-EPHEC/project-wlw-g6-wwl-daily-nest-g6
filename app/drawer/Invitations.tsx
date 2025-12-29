import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function Invitations() {
  const navigation = useNavigation();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [familiesJoined, setFamiliesJoined] = useState<{ id: string; name: string; code: string }[]>([]);
  
  // État pour envoyer une invitation
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<{ id: string; name: string; code: string } | null>(null);
  const [recipientCode, setRecipientCode] = useState("");
  const [invitationTitle, setInvitationTitle] = useState("");
  const [invitationDescription, setInvitationDescription] = useState("");
  const [invitationDate, setInvitationDate] = useState("");
  const [invitationTime, setInvitationTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");

  // État pour les invitations reçues
  const [receivedInvitations, setReceivedInvitations] = useState<any[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);

  // État pour les notifications de refus
  const [rejectionNotifications, setRejectionNotifications] = useState<any[]>([]);

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

    const q = query(collection(db, "families"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFamilies: any[] = [];
      snapshot.forEach(doc => allFamilies.push({ id: doc.id, ...doc.data() }));
      console.log("Invitations - Toutes les familles:", allFamilies.length);
      console.log("Invitations - Email utilisateur:", email);
      
      const userFamilies = allFamilies.filter((family: any) => {
        const members = family.members || [];
        console.log(`Invitations - Famille ${family.name}, membres:`, members);
        
        for (const memberItem of members) {
          if (typeof memberItem === 'string' && memberItem === email) {
            console.log(`Invitations - ✓ Trouvé dans ${family.name} (format ancien)`);
            return true;
          } else if (typeof memberItem === 'object' && memberItem.email === email) {
            console.log(`Invitations - ✓ Trouvé dans ${family.name} (format nouveau)`);
            return true;
          }
        }
        return false;
      });
      
      console.log("Invitations - Familles de l'utilisateur:", userFamilies.length);
      setFamiliesJoined(userFamilies);
    });

    return () => unsubscribe();
  }, [email]);

  // Charger les invitations reçues
  useEffect(() => {
    if (!familiesJoined.length) return;

    const familyIds = familiesJoined.map(f => f.id);
    
    const q = query(
      collection(db, "invitations"),
      where("recipientFamilyId", "in", familyIds)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invitations: any[] = [];
      snapshot.forEach(doc => {
        invitations.push({ id: doc.id, ...doc.data() });
      });
      setReceivedInvitations(invitations);
    });

    return () => unsubscribe();
  }, [familiesJoined]);

  // Charger les notifications de refus
  useEffect(() => {
    if (!familiesJoined.length) return;

    const familyIds = familiesJoined.map(f => f.id);
    
    const q = query(
      collection(db, "invitationResponses"),
      where("senderFamilyId", "in", familyIds),
      where("status", "==", "rejected")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: any[] = [];
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      setRejectionNotifications(notifications);

      // Afficher une alerte pour chaque nouvelle notification
      notifications.forEach(notif => {
        if (!notif.viewed) {
          Alert.alert(
            "Invitation refusée",
            `La famille "${notif.recipientFamilyName}" a refusé votre invitation "${notif.invitationTitle}".`,
            [
              {
                text: "OK",
                onPress: async () => {
                  // Marquer comme vue
                  await updateDoc(doc(db, "invitationResponses", notif.id), {
                    viewed: true
                  });
                }
              }
            ]
          );
        }
      });
    });

    return () => unsubscribe();
  }, [familiesJoined]);

  // Valider le format de date DD/MM/YYYY
  const validateDate = (dateStr: string): boolean => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);
    
    if (!match) {
      setDateError("Format invalide. Utilisez DD/MM/YYYY");
      return false;
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);

    if (month < 1 || month > 12) {
      setDateError("Mois invalide (01-12)");
      return false;
    }

    if (day < 1 || day > 31) {
      setDateError("Jour invalide (01-31)");
      return false;
    }

    // Vérification basique des jours par mois
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      daysInMonth[1] = 29; // Année bissextile
    }

    if (day > daysInMonth[month - 1]) {
      setDateError(`Ce mois n'a que ${daysInMonth[month - 1]} jours`);
      return false;
    }

    setDateError("");
    return true;
  };

  // Valider le format d'heure HH:MM
  const validateTime = (timeStr: string): boolean => {
    const timeRegex = /^(\d{2}):(\d{2})$/;
    const match = timeStr.match(timeRegex);
    
    if (!match) {
      setTimeError("Format invalide. Utilisez HH:MM");
      return false;
    }

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);

    if (hours < 0 || hours > 23) {
      setTimeError("Heures invalides (00-23)");
      return false;
    }

    if (minutes < 0 || minutes > 59) {
      setTimeError("Minutes invalides (00-59)");
      return false;
    }

    setTimeError("");
    return true;
  };

  // Envoyer une invitation
  const sendInvitation = async () => {
    console.log("=== Début envoi invitation ===");
    console.log("selectedFamily:", selectedFamily);
    console.log("recipientCode:", recipientCode);
    console.log("invitationTitle:", invitationTitle);
    console.log("invitationDescription:", invitationDescription);
    console.log("invitationDate:", invitationDate);
    console.log("invitationTime:", invitationTime);

    if (!selectedFamily) {
      console.log("❌ Pas de famille sélectionnée");
      Alert.alert("Erreur", "Veuillez sélectionner une famille");
      return;
    }

    if (!recipientCode.trim()) {
      console.log("❌ Pas de code destinataire");
      Alert.alert("Erreur", "Veuillez entrer le code de la famille destinataire");
      return;
    }

    if (!invitationTitle.trim()) {
      console.log("❌ Pas de titre");
      Alert.alert("Erreur", "Veuillez entrer un titre");
      return;
    }

    if (!invitationDescription.trim()) {
      console.log("❌ Pas de description");
      Alert.alert("Erreur", "Veuillez entrer une description");
      return;
    }

    console.log("Validation de la date...");
    if (!validateDate(invitationDate)) {
      console.log("❌ Date invalide");
      return;
    }

    console.log("Validation de l'heure...");
    if (!validateTime(invitationTime)) {
      console.log("❌ Heure invalide");
      return;
    }

    try {
      console.log("Recherche de la famille destinataire avec code:", recipientCode);
      
      // D'abord, afficher tous les codes disponibles pour le debug
      const allFamiliesSnapshot = await getDocs(collection(db, "families"));
      console.log("=== Codes de toutes les familles disponibles ===");
      allFamiliesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Famille: ${data.name}, Code: ${data.joinCode}`);
      });
      console.log("==============================================");
      
      // Vérifier que le code existe
      const familiesSnapshot = await getDocs(
        query(collection(db, "families"), where("joinCode", "==", recipientCode))
      );

      console.log("Résultat recherche:", familiesSnapshot.empty ? "Aucune famille trouvée" : "Famille trouvée");

      if (familiesSnapshot.empty) {
        Alert.alert("Erreur", "Code famille invalide");
        return;
      }

      const recipientFamily: any = {
        id: familiesSnapshot.docs[0].id,
        ...familiesSnapshot.docs[0].data()
      };

      console.log("Famille destinataire:", recipientFamily.name);

      // Créer l'invitation
      console.log("Création de l'invitation dans Firestore...");
      await addDoc(collection(db, "invitations"), {
        senderFamilyId: selectedFamily.id,
        senderFamilyName: selectedFamily.name,
        recipientFamilyId: recipientFamily.id,
        recipientFamilyName: recipientFamily.name,
        title: invitationTitle,
        description: invitationDescription,
        date: invitationDate,
        time: invitationTime,
        createdAt: serverTimestamp(),
        status: "pending"
      });

      console.log("✅ Invitation créée avec succès");
      Alert.alert("Succès", "Invitation envoyée");
      resetSendForm();
      setSendModalVisible(false);
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi:", error);
      Alert.alert("Erreur", "Impossible d'envoyer l'invitation");
    }
  };

  // Accepter une invitation
  const acceptInvitation = async (invitation: any) => {
    try {
      // Créer l'événement dans le calendrier de la famille destinataire
      await addDoc(collection(db, "families", invitation.recipientFamilyId, "calendar"), {
        title: invitation.title,
        description: invitation.description,
        date: invitation.date,
        time: invitation.time,
        createdAt: serverTimestamp(),
        fromInvitation: true,
        fromFamily: invitation.senderFamilyName
      });

      // Créer l'événement dans le calendrier de la famille émettrice
      await addDoc(collection(db, "families", invitation.senderFamilyId, "calendar"), {
        title: invitation.title,
        description: invitation.description,
        date: invitation.date,
        time: invitation.time,
        createdAt: serverTimestamp(),
        fromInvitation: true,
        fromFamily: invitation.recipientFamilyName
      });

      // Supprimer l'invitation
      await deleteDoc(doc(db, "invitations", invitation.id));

      Alert.alert("Succès", "L'événement a été ajouté aux calendriers des deux familles");
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
      Alert.alert("Erreur", "Impossible d'accepter l'invitation");
    }
  };

  // Refuser une invitation
  const rejectInvitation = async (invitation: any) => {
    try {
      // Créer une notification de refus
      await addDoc(collection(db, "invitationResponses"), {
        senderFamilyId: invitation.senderFamilyId,
        senderFamilyName: invitation.senderFamilyName,
        recipientFamilyId: invitation.recipientFamilyId,
        recipientFamilyName: invitation.recipientFamilyName,
        invitationTitle: invitation.title,
        status: "rejected",
        createdAt: serverTimestamp(),
        viewed: false
      });

      // Supprimer l'invitation
      await deleteDoc(doc(db, "invitations", invitation.id));

      Alert.alert("Refusé", "L'invitation a été refusée");
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Erreur lors du refus:", error);
      Alert.alert("Erreur", "Impossible de refuser l'invitation");
    }
  };

  const resetSendForm = () => {
    setSelectedFamily(null);
    setRecipientCode("");
    setInvitationTitle("");
    setInvitationDescription("");
    setInvitationDate("");
    setInvitationTime("");
    setDateError("");
    setTimeError("");
  };

  return (
    <View style={styles.container}>
      {/* Header avec burger menu */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.burgerMenu}
        >
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Invitations</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Bouton pour envoyer une invitation */}
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => setSendModalVisible(true)}
        >
          <Ionicons name="send" size={24} color="#fff" />
          <Text style={styles.sendButtonText}>Envoyer une invitation</Text>
        </TouchableOpacity>

        {/* Liste des invitations reçues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invitations reçues</Text>
          {receivedInvitations.length === 0 ? (
            <Text style={styles.emptyText}>Aucune invitation reçue</Text>
          ) : (
            receivedInvitations.map(invitation => (
              <TouchableOpacity
                key={invitation.id}
                style={styles.invitationCard}
                onPress={() => {
                  setSelectedInvitation(invitation);
                  setDetailModalVisible(true);
                }}
              >
                <View style={styles.invitationHeader}>
                  <Text style={styles.invitationTitle}>{invitation.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
                <Text style={styles.invitationFrom}>
                  De: {invitation.senderFamilyName}
                </Text>
                <Text style={styles.invitationDate}>
                  {invitation.date} à {invitation.time}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal pour envoyer une invitation */}
      <Modal
        visible={sendModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Envoyer une invitation</Text>
              <TouchableOpacity onPress={() => setSendModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sélection de la famille émettrice */}
              <Text style={styles.label}>Votre famille ({familiesJoined.length})</Text>
              <View style={styles.pickerContainer}>
                {familiesJoined.map(family => (
                  <TouchableOpacity
                    key={family.id}
                    style={[
                      styles.familyOption,
                      selectedFamily?.id === family.id && styles.familyOptionSelected
                    ]}
                    onPress={() => setSelectedFamily(family)}
                  >
                    <Text style={[
                      styles.familyOptionText,
                      selectedFamily?.id === family.id && styles.familyOptionTextSelected
                    ]}>
                      {family.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Code de la famille destinataire */}
              <Text style={styles.label}>Code de la famille destinataire</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 123456"
                value={recipientCode}
                onChangeText={setRecipientCode}
                keyboardType="numeric"
                maxLength={6}
              />

              {/* Titre */}
              <Text style={styles.label}>Titre de l'invitation</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Sortie au parc"
                value={invitationTitle}
                onChangeText={setInvitationTitle}
                maxLength={50}
              />
              <Text style={styles.charCount}>{invitationTitle.length}/50</Text>

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez l'activité..."
                value={invitationDescription}
                onChangeText={setInvitationDescription}
                maxLength={500}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.charCount}>{invitationDescription.length}/500</Text>

              {/* Date */}
              <Text style={styles.label}>Date (DD/MM/YYYY)</Text>
              <TextInput
                style={[styles.input, dateError ? styles.inputError : null]}
                placeholder="Ex: 25/12/2025"
                value={invitationDate}
                onChangeText={(text) => {
                  setInvitationDate(text);
                  if (text.length === 10) {
                    validateDate(text);
                  } else {
                    setDateError("");
                  }
                }}
                maxLength={10}
              />
              {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

              {/* Heure */}
              <Text style={styles.label}>Heure (HH:MM)</Text>
              <TextInput
                style={[styles.input, timeError ? styles.inputError : null]}
                placeholder="Ex: 14:30"
                value={invitationTime}
                onChangeText={(text) => {
                  setInvitationTime(text);
                  if (text.length === 5) {
                    validateTime(text);
                  } else {
                    setTimeError("");
                  }
                }}
                maxLength={5}
              />
              {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

              <TouchableOpacity style={styles.submitButton} onPress={sendInvitation}>
                <Text style={styles.submitButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de détails d'invitation */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de l'invitation</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedInvitation && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.detailLabel}>Titre</Text>
                <Text style={styles.detailValue}>{selectedInvitation.title}</Text>

                <Text style={styles.detailLabel}>De</Text>
                <Text style={styles.detailValue}>{selectedInvitation.senderFamilyName}</Text>

                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedInvitation.description}</Text>

                <Text style={styles.detailLabel}>Date et heure</Text>
                <Text style={styles.detailValue}>
                  {selectedInvitation.date} à {selectedInvitation.time}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => acceptInvitation(selectedInvitation)}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Accepter</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => rejectInvitation(selectedInvitation)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  burgerMenu: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffbf00",
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffbf00",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  invitationCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  invitationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  invitationFrom: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 14,
    color: "#ffbf00",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 4,
  },
  pickerContainer: {
    marginBottom: 10,
  },
  familyOption: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  familyOptionSelected: {
    backgroundColor: "#fff8e1",
    borderColor: "#ffbf00",
  },
  familyOptionText: {
    fontSize: 14,
    color: "#333",
  },
  familyOptionTextSelected: {
    color: "#ffbf00",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#ffbf00",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#4caf50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
