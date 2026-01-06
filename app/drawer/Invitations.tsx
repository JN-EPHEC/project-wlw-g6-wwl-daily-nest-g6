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
      snapshot.forEach((doc) => allFamilies.push({ id: doc.id, ...doc.data() }));
      console.log("Invitations - Toutes les familles:", allFamilies.length);
      console.log("Invitations - Email utilisateur:", email);

      const userFamilies = allFamilies.filter((family: any) => {
        const members = family.members || [];
        console.log(`Invitations - Famille ${family.name}, membres:`, members);

        for (const memberItem of members) {
          if (typeof memberItem === "string" && memberItem === email) {
            console.log(`Invitations - ✓ Trouvé dans ${family.name} (format ancien)`);
            return true;
          } else if (typeof memberItem === "object" && memberItem.email === email) {
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

    const familyIds = familiesJoined.map((f) => f.id);

    const q = query(collection(db, "invitations"), where("recipientFamilyId", "in", familyIds));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invitations: any[] = [];
      snapshot.forEach((doc) => {
        invitations.push({ id: doc.id, ...doc.data() });
      });
      setReceivedInvitations(invitations);
    });

    return () => unsubscribe();
  }, [familiesJoined]);

  // Charger les notifications de refus
  useEffect(() => {
    if (!familiesJoined.length) return;

    const familyIds = familiesJoined.map((f) => f.id);

    const q = query(
      collection(db, "invitationResponses"),
      where("senderFamilyId", "in", familyIds),
      where("status", "==", "rejected")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: any[] = [];
      snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      setRejectionNotifications(notifications);

      // Afficher une alerte pour chaque nouvelle notification
      notifications.forEach((notif) => {
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
                    viewed: true,
                  });
                },
              },
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
      allFamiliesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Famille: ${data.name}, Code: ${data.joinCode}`);
      });
      console.log("==============================================");

      // Vérifier que le code existe
      const familiesSnapshot = await getDocs(query(collection(db, "families"), where("joinCode", "==", recipientCode)));

      console.log("Résultat recherche:", familiesSnapshot.empty ? "Aucune famille trouvée" : "Famille trouvée");

      if (familiesSnapshot.empty) {
        Alert.alert("Erreur", "Code famille invalide");
        return;
      }

      const recipientFamily: any = {
        id: familiesSnapshot.docs[0].id,
        ...familiesSnapshot.docs[0].data(),
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
        status: "pending",
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
        fromFamily: invitation.senderFamilyName,
      });

      // Créer l'événement dans le calendrier de la famille émettrice
      await addDoc(collection(db, "families", invitation.senderFamilyId, "calendar"), {
        title: invitation.title,
        description: invitation.description,
        date: invitation.date,
        time: invitation.time,
        createdAt: serverTimestamp(),
        fromInvitation: true,
        fromFamily: invitation.recipientFamilyName,
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
        viewed: false,
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
  <View className="flex-1 bg-[#FAFBFC] pt-[50px]">
    {/* Header avec burger menu */}
    <View className="flex-row items-center px-5 pb-5 bg-white">
      <TouchableOpacity 
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} 
        className="mr-4 w-12 h-12 rounded-2xl items-center justify-center"
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={26} color="#68cb30" />
      </TouchableOpacity>
      <Text className="text-[24px] font-bold text-[#111827] flex-1">Invitations</Text>
      
      {/* Badge notification */}
      {receivedInvitations.length > 0 && (
        <View className="bg-[#F64040] px-3 py-1.5 rounded-full">
          <Text className="text-white text-[13px] font-bold">
            {receivedInvitations.length}
          </Text>
        </View>
      )}
    </View>

    <ScrollView className="flex-1 w-full px-5 pt-5">
      {/* Bouton pour envoyer une invitation */}
      <TouchableOpacity 
        className="flex-row items-center justify-center py-4 px-6 rounded-2xl mb-6"
        style={{
          backgroundColor: '#FF914D',
          shadowColor: "#FF914D",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 4,
        }}
        onPress={() => setSendModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="send" size={22} color="#fff" />
        <Text className="text-white text-[16px] font-bold ml-2">Envoyer une invitation</Text>
      </TouchableOpacity>

      {/* Liste des invitations reçues */}
      <View className="mb-5">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
            Invitations reçues
          </Text>
          {receivedInvitations.length > 0 && (
            <Text className="text-[14px] text-[#6B7280]">
              {receivedInvitations.length} en attente
            </Text>
          )}
        </View>
        
        {receivedInvitations.length === 0 ? (
          <View 
            className="bg-white rounded-3xl p-8 items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="w-16 h-16 rounded-full bg-[#FFF4ED] items-center justify-center mb-4">
              <Ionicons name="mail-open-outline" size={32} color="#FF914D" />
            </View>
            <Text className="text-[18px] font-bold text-[#111827] mb-2">
              Aucune invitation
            </Text>
            <Text className="text-[14px] text-[#9CA3AF] text-center">
              Vous n'avez pas encore reçu d'invitation
            </Text>
          </View>
        ) : (
          receivedInvitations.map((invitation) => (
            <TouchableOpacity
              key={invitation.id}
              className="bg-white rounded-3xl p-5 mb-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
              onPress={() => {
                setSelectedInvitation(invitation);
                setDetailModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-2xl bg-[#EBF5FF] items-center justify-center mr-4">
                  <Ionicons name="people" size={24} color="#60AFDF" />
                </View>
                
                <View className="flex-1">
                  <Text className="text-[18px] font-bold text-[#111827] mb-1">
                    {invitation.title}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="home-outline" size={14} color="#9CA3AF" />
                    <Text className="text-[14px] text-[#6B7280] ml-1.5">
                      De: {invitation.senderFamilyName}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
              </View>

              <View 
                className="flex-row items-center px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: '#FFF7F1' }}
              >
                <Ionicons name="calendar-outline" size={16} color="#FF914D" />
                <Text className="text-[14px] text-[#FF914D] font-semibold ml-2">
                  {invitation.date} à {invitation.time}
                </Text>
              </View>
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
      <View className="flex-1 bg-black/60 justify-center items-center">
        <View className="bg-white rounded-3xl w-[90%] max-h-[85%]">
          <View className="flex-row items-center justify-between p-6 border-b border-[#F1F3F5]">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-2xl bg-[#FFF4ED] items-center justify-center mr-3">
                <Ionicons name="send" size={20} color="#FF914D" />
              </View>
              <Text className="text-[22px] font-bold text-[#111827]">Nouvelle invitation</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setSendModalVisible(false)}
              className="w-10 h-10 rounded-full bg-[#F8F9FA] items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            {/* Sélection de la famille qui envoie */}
            <Text className="text-[12px] font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
              Votre famille ({familiesJoined.length})
            </Text>
            <View className="mb-5">
              {familiesJoined.map((family) => (
                <TouchableOpacity
                  key={family.id}
                  className={`rounded-2xl p-4 mb-2 border-2 ${
                    selectedFamily?.id === family.id 
                      ? "bg-[#FFF4ED] border-[#FF914D]" 
                      : "bg-white border-[#E5E7EB]"
                  }`}
                  onPress={() => setSelectedFamily(family)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      selectedFamily?.id === family.id ? "text-[#FF914D]" : "text-[#6B7280]"
                    }`}
                  >
                    👨‍👩‍👧‍👦 {family.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Code de la famille destinataire */}
            <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
              Code de la famille destinataire
            </Text>
            <TextInput
              className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] text-[#111827] mb-5"
              placeholder="Ex: 123456"
              placeholderTextColor="#9CA3AF"
              value={recipientCode}
              onChangeText={setRecipientCode}
              keyboardType="numeric"
              maxLength={6}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            />

            {/* Titre */}
            <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
              Titre de l'invitation
            </Text>
            <TextInput
              className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] text-[#111827] mb-1"
              placeholder="Ex: Sortie au parc"
              placeholderTextColor="#9CA3AF"
              value={invitationTitle}
              onChangeText={setInvitationTitle}
              maxLength={50}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
            <Text className="text-[12px] text-[#9CA3AF] text-right mb-5">
              {invitationTitle.length}/50
            </Text>

            {/* Description */}
            <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
              Description
            </Text>
            <TextInput
              className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] text-[#111827] mb-1"
              placeholder="Décrivez l'activité..."
              placeholderTextColor="#9CA3AF"
              value={invitationDescription}
              onChangeText={setInvitationDescription}
              maxLength={500}
              multiline
              numberOfLines={4}
              style={{ 
                textAlignVertical: "top",
                minHeight: 100,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
            <Text className="text-[12px] text-[#9CA3AF] text-right mb-5">
              {invitationDescription.length}/500
            </Text>

            {/* Date et Heure - Côte à côte */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
                  Date
                </Text>
                <TextInput
                  className={`bg-white border rounded-2xl px-4 py-4 text-[16px] text-[#111827] ${
                    dateError ? "border-[#F64040]" : "border-[#E5E7EB]"
                  }`}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor="#9CA3AF"
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
                {dateError ? (
                  <Text className="text-[11px] text-[#F64040] mt-1">{dateError}</Text>
                ) : null}
              </View>

              <View className="flex-1">
                <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
                  Heure
                </Text>
                <TextInput
                  className={`bg-white border rounded-2xl px-4 py-4 text-[16px] text-[#111827] ${
                    timeError ? "border-[#F64040]" : "border-[#E5E7EB]"
                  }`}
                  placeholder="HH:MM"
                  placeholderTextColor="#9CA3AF"
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
                {timeError ? (
                  <Text className="text-[11px] text-[#F64040] mt-1">{timeError}</Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity 
              className="py-4 rounded-3xl items-center mt-2"
              style={{
                backgroundColor: '#FF914D',
                shadowColor: "#FF914D",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={sendInvitation}
              activeOpacity={0.85}
            >
              <Text className="text-white text-[16px] font-bold">Envoyer l'invitation</Text>
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
      <View className="flex-1 bg-black/60 justify-center items-center">
        <View className="bg-white rounded-3xl w-[90%] max-h-[80%]">
          <View className="flex-row items-center justify-between p-6 border-b border-[#F1F3F5]">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-2xl bg-[#EBF5FF] items-center justify-center mr-3">
                <Ionicons name="mail-open" size={20} color="#60AFDF" />
              </View>
              <Text className="text-[22px] font-bold text-[#111827]">Invitation</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setDetailModalVisible(false)}
              className="w-10 h-10 rounded-full bg-[#F8F9FA] items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedInvitation && (
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {/* Titre */}
              <View className="mb-5">
                <Text className="text-[12px] font-semibold text-[#9CA3AF] mb-2 uppercase tracking-wide">
                  Titre
                </Text>
                <Text className="text-[20px] font-bold text-[#111827]">
                  {selectedInvitation.title}
                </Text>
              </View>

              {/* De */}
              <View className="mb-5">
                <Text className="text-[12px] font-semibold text-[#9CA3AF] mb-2 uppercase tracking-wide">
                  Famille émettrice
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="people" size={20} color="#60AFDF" />
                  <Text className="text-[16px] text-[#111827] font-semibold ml-2">
                    {selectedInvitation.senderFamilyName}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View className="mb-5">
                <Text className="text-[12px] font-semibold text-[#9CA3AF] mb-2 uppercase tracking-wide">
                  Description
                </Text>
                <View className="bg-[#FAFBFC] rounded-2xl p-4">
                  <Text className="text-[15px] text-[#111827] leading-6">
                    {selectedInvitation.description}
                  </Text>
                </View>
              </View>

              {/* Date et heure */}
              <View className="mb-6">
                <Text className="text-[12px] font-semibold text-[#9CA3AF] mb-2 uppercase tracking-wide">
                  Date et heure
                </Text>
                <View 
                  className="flex-row items-center px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: '#FFF7F1' }}
                >
                  <Ionicons name="calendar" size={20} color="#FF914D" />
                  <Text className="text-[16px] text-[#FF914D] font-bold ml-3">
                    {selectedInvitation.date} à {selectedInvitation.time}
                  </Text>
                </View>
              </View>

              {/* Boutons d'action */}
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity 
                  className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
                  style={{
                    backgroundColor: '#ABF085',
                    shadowColor: "#ABF085",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  onPress={() => acceptInvitation(selectedInvitation)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text className="text-white text-[15px] font-bold ml-2">Accepter</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
                  style={{
                    backgroundColor: '#F64040',
                    shadowColor: "#F64040",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  onPress={() => rejectInvitation(selectedInvitation)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close-circle" size={22} color="#fff" />
                  <Text className="text-white text-[15px] font-bold ml-2">Refuser</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  </View>
);}