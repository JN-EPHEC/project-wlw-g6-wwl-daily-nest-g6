
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { auth, db } from "../../firebaseConfig";

// Fonction pour obtenir la couleur en fonction de la priorité
const getPriorityColor = (priority: string): string => {
  switch(priority) {
    default: return "#2196F3"; // Bleu par défaut
    case "1": return "#4CAF50"; // Vert
    case "2": return "#2196F3"; // Bleu
    case "3": return "#FF9800"; // Orange
    case "4": return "#F44336"; // Rouge
    
  }
};

export default function Home() {
  const [events, setEvents] = useState<{ [key: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalViewVisible, setModalViewVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [items, setItems] = useState<{ [key: string]: { 
    id: string; 
    title: string; 
    time: string; 
    description?: string;
    points?: number;
    priority?: string; 
    checked?: boolean; 
    assignedTo?: string; 
    isRotation?: boolean;
    rotationMembers?: string[];
    isRecurring?: boolean;
    recurrenceType?: "daily" | "weekly" | "monthly";
    selectedDays?: number[];
    monthlyDay?: number;
    reminders?: Array<{ date: string; time: string; message: string }> 
  }[] }>({});
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eventDescription, setEventDescription] = useState("");
  const [eventPoints, setEventPoints] = useState("");
  const [eventPriority, setEventPriority] = useState("2");
  const [eventAssignedTo, setEventAssignedTo] = useState("");
  const [eventIsRotation, setEventIsRotation] = useState(false);
  const [eventRotationMembers, setEventRotationMembers] = useState<string[]>([]);
  const [eventIsRecurring, setEventIsRecurring] = useState(false);
  const [eventRecurrenceType, setEventRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [eventSelectedDays, setEventSelectedDays] = useState<number[]>([]);
  const [eventMonthlyDay, setEventMonthlyDay] = useState<number>(1);
  const [eventReminders, setEventReminders] = useState<Array<{ date: string; time: string; message?: string }>>([]);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [calendarTheme, setCalendarTheme] = useState("#ffbf00"); // Couleur du thème du calendrier 

const [selectedCalendarType, setSelectedCalendarType] = useState("personal");
const [families, setFamilies] = useState<any[]>([]);
const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
const [familiesJoined, setFamiliesJoined] = useState<{ id: string; name: string; ownerId: string; members: string[] }[]>([]);
const [sortBy, setSortBy] = useState<"none" | "priority-desc" | "priority-asc" | "time">("none");
const [filterByPerson, setFilterByPerson] = useState<string | null>(null);



const [uid, setUid] = useState<string | null>(null);
const [email, setEmail] = useState<string | null>(null);
const [usersMap, setUsersMap] = useState<{ [uid: string]: { firstName: string; lastName: string } }>({});
const [familyMembers, setFamilyMembers] = useState<{ uid: string; firstName: string; lastName: string }[]>([]);


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


useEffect(() => {
  // Reset quand on change de calendrier
  setEvents({});
  setItems({});
  setSelectedDate("");
  setFilterByPerson(null);
}, [selectedCalendarType, selectedFamily]);

// pour trouver les infos des familles 
useEffect(() => {
  if (!email) return;

  // Charger TOUTES les familles et filtrer côté client (pour supporter les deux formats)
  const q = query(collection(db, "families"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const allFamilies: any[] = [];
    snapshot.forEach(doc => allFamilies.push({ id: doc.id, ...doc.data() }));
    
    // Filtrer pour ne garder que les familles où l'utilisateur est membre
    const userFamilies = allFamilies.filter((family: any) => {
      const members = family.members || [];
      
      for (const memberItem of members) {
        if (typeof memberItem === 'string' && memberItem === email) {
          return true; // Format ancien (string)
        } else if (typeof memberItem === 'object' && memberItem.email === email) {
          return true; // Format nouveau ({email, role})
        }
      }
      return false;
    });
    
    setFamiliesJoined(userFamilies);
  });

  return () => unsubscribe();
}, [email]);

// Charger tous les utilisateurs pour afficher les noms
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
    const users: { [uid: string]: { firstName: string; lastName: string } } = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      users[doc.id] = {
        firstName: data.prenom || data.firstName || data.firstname || data.name || "Utilisateur",
        lastName: data.nom || data.lastName || data.lastname || "",
      };
    });
    setUsersMap(users);
  });

  return () => unsubscribe();
}, []);

// Charger les membres de la famille sélectionnée
useEffect(() => {
  if (selectedCalendarType !== "family" || !selectedFamily) {
    setFamilyMembers([]);
    return;
  }

  const loadFamilyMembers = async () => {
    try {
      const familyDoc = await getDoc(doc(db, "families", selectedFamily.id));
      const familyData = familyDoc.data();
      
      if (!familyData || !familyData.members) return;

      const members: { uid: string; firstName: string; lastName: string }[] = [];

      for (const memberItem of familyData.members) {
        const memberEmail = typeof memberItem === 'string' ? memberItem : memberItem.email;
        
        const usersQuery = query(collection(db, "users"), where("email", "==", memberEmail));
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          members.push({
            uid: userDoc.id,
            firstName: userData.prenom || userData.firstName || userData.firstname || userData.name || "Utilisateur",
            lastName: userData.nom || userData.lastName || userData.lastname || ""
          });
        });
      }
      
      setFamilyMembers(members);
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    }
  };

  loadFamilyMembers();
}, [selectedCalendarType, selectedFamily]);

useEffect(() => {
  if (!uid) return;

  let unsubscribe: any;

  if (selectedCalendarType === "personal") {
    unsubscribe = onSnapshot(
      collection(db, "users", uid, "calendar"),
      (snapshot) => {
        const newEvents: any = {};
        const newItems: any = {};

        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Convertir JJ/MM/AAAA en YYYY-MM-DD pour le calendrier
          let calendarDate = data.date;
          if (data.date && data.date.includes('/')) {
            const parts = data.date.split('/');
            if (parts.length === 3) {
              calendarDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          
          newEvents[calendarDate] = { marked: true, dotColor: "#ffbf00ff" };
          if (!newItems[calendarDate]) newItems[calendarDate] = [];
          newItems[calendarDate].push({ 
            id: doc.id, 
            title: data.title, 
            time: data.time, 
            description: data.description,
            points: data.points,
            priority: data.priority, 
            checked: data.checked || false, 
            assignedTo: data.assignedTo, 
            isRotation: data.isRotation,
            rotationMembers: data.rotationMembers || [],
            isRecurring: data.isRecurring,
            recurrenceType: data.recurrenceType,
            selectedDays: data.selectedDays || [],
            monthlyDay: data.monthlyDay,
            reminders: data.reminders || [] 
          });
        });

        setEvents(newEvents);
        setItems(newItems);
      }
    );
  }

  if (selectedCalendarType === "family" && selectedFamily) {
  unsubscribe = onSnapshot(
    collection(db, "families", selectedFamily.id, "calendar"),
    (snapshot) => {
      const newEvents: any = {};
      const newItems: any = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Convertir JJ/MM/AAAA en YYYY-MM-DD pour le calendrier
        let calendarDate = data.date;
        if (data.date && data.date.includes('/')) {
          const parts = data.date.split('/');
          if (parts.length === 3) {
            calendarDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        
        newEvents[calendarDate] = { marked: true, dotColor: "#ff0000" };
        if (!newItems[calendarDate]) newItems[calendarDate] = [];
        newItems[calendarDate].push({ 
          id: doc.id, 
          title: data.title, 
          time: data.time, 
          description: data.description,
          points: data.points,
          priority: data.priority, 
          checked: data.checked || false, 
          assignedTo: data.assignedTo, 
          isRotation: data.isRotation,
          rotationMembers: data.rotationMembers || [],
          isRecurring: data.isRecurring,
          recurrenceType: data.recurrenceType,
          selectedDays: data.selectedDays || [],
          monthlyDay: data.monthlyDay,
          reminders: data.reminders || [] 
        });
      });
      setEvents(newEvents);
      setItems(newItems);
    }
    
  );
}

  return () => unsubscribe && unsubscribe();
}, [selectedCalendarType, selectedFamily, uid]);


const saveEvent = async () => {
  if (!eventTitle || !eventDate || !eventTime) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  try {
    // Convertir YYYY-MM-DD (du calendrier) en JJ/MM/AAAA pour la sauvegarde
    const dateParts = eventDate.split('-');
    const formattedDate = dateParts.length === 3 
      ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` 
      : eventDate;
      
    let path: any;

    if (selectedCalendarType === "personal") {
  if (!uid) return;
  path = collection(db, "users", uid, "calendar");
} else {
  if (!selectedFamily || !selectedFamily.id) return;
  path = collection(db, "families", selectedFamily.id, "calendar");
}

    if (editingIndex !== null && editingEventId) {
      const docRef = selectedCalendarType === "personal"
        ? doc(db, "users", uid!, "calendar", editingEventId)
        : doc(db, "families", selectedFamily!.id, "calendar", editingEventId);
      
      await updateDoc(docRef, { 
        title: eventTitle, 
        time: eventTime,
        description: eventDescription,
        points: parseInt(eventPoints) || 0,
        priority: eventPriority,
        assignedTo: eventAssignedTo || null,
        isRotation: eventIsRotation,
        rotationMembers: eventIsRotation ? eventRotationMembers : [],
        isRecurring: eventIsRecurring,
        recurrenceType: eventIsRecurring ? eventRecurrenceType : null,
        selectedDays: eventIsRecurring && eventRecurrenceType === "weekly" ? eventSelectedDays : [],
        monthlyDay: eventIsRecurring && eventRecurrenceType === "monthly" ? eventMonthlyDay : null,
        reminders: eventReminders
      });
    } else {
      await addDoc(path, { 
        title: eventTitle, 
        date: formattedDate, 
        time: eventTime, 
        checked: false,
        description: eventDescription,
        points: parseInt(eventPoints) || 0,
        priority: eventPriority,
        assignedTo: eventAssignedTo || null,
        isRotation: eventIsRotation,
        rotationMembers: eventIsRotation ? eventRotationMembers : [],
        isRecurring: eventIsRecurring,
        recurrenceType: eventIsRecurring ? eventRecurrenceType : null,
        selectedDays: eventIsRecurring && eventRecurrenceType === "weekly" ? eventSelectedDays : [],
        monthlyDay: eventIsRecurring && eventRecurrenceType === "monthly" ? eventMonthlyDay : null,
        reminders: eventReminders
      });
    }

    alert("Événement sauvegardé !");
    setModalVisible(false);
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventDescription("");
    setEventPoints("");
    setEventPriority("2");
    setEventAssignedTo("");
    setEventIsRotation(false);
    setEventRotationMembers([]);
    setEventIsRecurring(false);
    setEventRecurrenceType("weekly");
    setEventSelectedDays([]);
    setEventMonthlyDay(1);
    setEventReminders([]);
    setEditingIndex(null);
    setEditingEventId(null);
    setIsEditing(false);

  } catch (err) {
    alert("Impossible de sauvegarder");
  }
};

  const toggleEventChecked = async (eventId: string, currentChecked: boolean) => {
    if (!uid) return;
    
    try {
      let docRef;
      if (selectedCalendarType === "personal") {
        docRef = doc(db, "users", uid, "calendar", eventId);
      } else {
        if (!selectedFamily) return;
        docRef = doc(db, "families", selectedFamily.id, "calendar", eventId);
      }
      
      const newCheckedState = !currentChecked;
      await updateDoc(docRef, { checked: newCheckedState });
      
      // Récupérer les détails de l'événement pour les points
      const eventDoc = await getDoc(docRef);
      const eventData = eventDoc.data();
      
      // Ajouter ou retirer des points si l'événement en a
      if (eventData && eventData.points && eventData.points > 0) {
        const pointsToAdd = newCheckedState ? eventData.points : -eventData.points;
        
        // Déterminer qui reçoit les points
        let targetUserId = uid; // Par défaut, l'utilisateur actuel
        
        // Si l'événement est assigné à quelqu'un, cette personne reçoit les points
        if (eventData.assignedTo) {
          targetUserId = eventData.assignedTo;
        }
        
        try {
          if (selectedCalendarType === "personal") {
            // Points personnels
            const userDocRef = doc(db, "users", targetUserId);
            await updateDoc(userDocRef, {
              points: increment(pointsToAdd)
            });
          } else if (selectedFamily) {
            // Points dans la famille
            const memberDocRef = doc(db, "families", selectedFamily.id, "members", targetUserId);
            
            // Vérifier si le document membre existe
            const memberDoc = await getDoc(memberDocRef);
            if (memberDoc.exists()) {
              await updateDoc(memberDocRef, {
                points: increment(pointsToAdd)
              });
            } else {
              // Créer le document s'il n'existe pas avec setDoc
              await setDoc(memberDocRef, {
                points: pointsToAdd
              }, { merge: true });
            }
          }
        } catch (error) {
          console.error("Erreur lors de l'ajout des points:", error);
        }
      }
    } catch (err) {
      console.error("Erreur toggle:", err);
    }
  };
  const deleteEvent = async (eventId: string) => {
    if (!uid) {
      alert("Erreur : Utilisateur non connecté");
      return;
    }
    
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?");
    
    if (confirmDelete) {
      try {
        let docRef;
        if (selectedCalendarType === "personal") {
          docRef = doc(db, "users", uid, "calendar", eventId);
        } else {
          docRef = doc(db, "users", selectedFamily.ownerId, "families", selectedFamily.id, "calendar", eventId);
        }
        await deleteDoc(docRef);
        alert("Événement supprimé !");
      } catch (err) {
        alert("Impossible de supprimer l'événement.");
      }
    }
  };

  
  useEffect(() => {
  if (!email) return;

  const unsubscribe = onSnapshot(collection(db, "users"), async (snapshot) => {
    const fams: any[] = [];
    for (const docUser of snapshot.docs) {
      const famCol = collection(db, "users", docUser.id, "families");
      const famSnap = await getDocs(famCol);
      famSnap.forEach(f => {
        const data = f.data();
        if (data.members.includes(email)) {
          fams.push({ id: f.id, ownerId: docUser.id, ...data });
        }
      });
    }
    setFamilies(fams);
  });

  return () => unsubscribe();
}, [email]);

    


  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ flexGrow: 1 }}>
<View style={styles.calendarContainer}>
  <View style={{ width: "100%", padding: 10, alignItems: "center", zIndex: 1, position: 'relative' }}>
  <View style={{
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "white",
    width: "70%",
    boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
    zIndex: 1
  }}>
    <Picker
  selectedValue={selectedFamily?.id || "personal"}
  onValueChange={(value) => {
    if (value === "personal") {
      setSelectedCalendarType("personal");
      setSelectedFamily(null);
    } else {
      const fam = familiesJoined.find(f => f.id === value);
      if (fam) {
        setSelectedFamily(fam);
        setSelectedCalendarType("family");
      }
    }
  }}
  style={{
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  }}
>
  <Picker.Item label="Calendrier personnel" value="personal" />
  <Picker.Item label="── Calendriers famille ──" value="" enabled={false} />
  {familiesJoined.map(f => (
    <Picker.Item key={f.id} label={f.name} value={f.id} />
  ))}
  
</Picker>

  </View>
</View>

      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString); 
        }}
        markedDates={{
          ...events, 
          [selectedDate]: { selected: true, selectedColor: calendarTheme },
        }}
        renderArrow={(direction) => ( 
          <Ionicons
            name={direction === "left" ? "chevron-back" : "chevron-forward"}
            size={19}
            color={calendarTheme}
            style={{ marginHorizontal: 50 }}
          />
        )}
        theme={{
          arrowColor: calendarTheme,
          monthTextColor: "#000000ff",
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
          todayTextColor: calendarTheme,
          selectedDayBackgroundColor: calendarTheme,
        }}
      />

      {/* Container des tâches du jour sélectionné */}
      {selectedDate && items[selectedDate] && items[selectedDate].length > 0 && (
        <View style={styles.tasksContainer}>
          <Text style={styles.tasksTitle}>
            Tâches du {selectedDate.split('-').reverse().join('/')}
          </Text>
          
          {/* Filtre compact */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginRight: 8 }}>Trier :</Text>
            <View style={{ width: 180, borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 6, overflow: "hidden" }}>
              <Picker
                selectedValue={sortBy}
                onValueChange={(value) => setSortBy(value)}
                style={{ height: 35, fontSize: 12 }}
              >
                <Picker.Item label="Aucun" value="none" />
                <Picker.Item label="Priorité ↑ (urgent en haut)" value="priority-desc" />
                <Picker.Item label="Priorité ↓ (urgent en bas)" value="priority-asc" />
                <Picker.Item label="Heure" value="time" />
              </Picker>
            </View>
          </View>

          {/* Filtre par personne */}
          {selectedCalendarType === "family" && familyMembers.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>Filtrer par personne :</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setFilterByPerson(null)}
                  style={[
                    styles.personFilterChip,
                    !filterByPerson && styles.personFilterChipActive
                  ]}
                >
                  <Text style={[
                    styles.personFilterText,
                    !filterByPerson && styles.personFilterTextActive
                  ]}>Tous</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setFilterByPerson(uid)}
                  style={[
                    styles.personFilterChip,
                    filterByPerson === uid && styles.personFilterChipActive
                  ]}
                >
                  <Text style={[
                    styles.personFilterText,
                    filterByPerson === uid && styles.personFilterTextActive
                  ]}>Moi</Text>
                </TouchableOpacity>
                
                {familyMembers.filter(m => m.uid !== uid).map(member => (
                  <TouchableOpacity
                    key={member.uid}
                    onPress={() => setFilterByPerson(member.uid)}
                    style={[
                      styles.personFilterChip,
                      filterByPerson === member.uid && styles.personFilterChipActive
                    ]}
                  >
                    <Text style={[
                      styles.personFilterText,
                      filterByPerson === member.uid && styles.personFilterTextActive
                    ]}>{member.firstName}</Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  onPress={() => setFilterByPerson("unassigned")}
                  style={[
                    styles.personFilterChip,
                    filterByPerson === "unassigned" && styles.personFilterChipActive
                  ]}
                >
                  <Text style={[
                    styles.personFilterText,
                    filterByPerson === "unassigned" && styles.personFilterTextActive
                  ]}>Non assignées</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(() => {
            let sortedItems = [...items[selectedDate]];
            
            // Filtrer par personne si un filtre est actif
            if (filterByPerson !== null) {
              if (filterByPerson === "unassigned") {
                sortedItems = sortedItems.filter(item => !item.assignedTo);
              } else {
                sortedItems = sortedItems.filter(item => item.assignedTo === filterByPerson);
              }
            }
            
            // D'abord séparer les tâches cochées et non cochées
            const uncheckedItems = sortedItems.filter(item => !item.checked);
            const checkedItems = sortedItems.filter(item => item.checked);
            
            // Appliquer le tri sur chaque groupe
            const applySorting = (itemsList: any[]) => {
              if (sortBy === "priority-desc") {
                itemsList.sort((a, b) => {
                  const priorityA = parseInt(a.priority || "2");
                  const priorityB = parseInt(b.priority || "2");
                  return priorityB - priorityA;
                });
              } else if (sortBy === "priority-asc") {
                itemsList.sort((a, b) => {
                  const priorityA = parseInt(a.priority || "2");
                  const priorityB = parseInt(b.priority || "2");
                  return priorityA - priorityB;
                });
              } else if (sortBy === "time") {
                itemsList.sort((a, b) => {
                  if (!a.time && !b.time) return 0;
                  if (!a.time) return 1;
                  if (!b.time) return -1;
                  return a.time.localeCompare(b.time);
                });
              }
            };
            
            applySorting(uncheckedItems);
            applySorting(checkedItems);
            
            // Combiner: non cochées d'abord, puis cochées
            sortedItems = [...uncheckedItems, ...checkedItems];
            
            return sortedItems.map((item, index) => (
            <View key={item.id} style={[styles.taskItem, { borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority || "2") }]}>
              <TouchableOpacity onPress={() => toggleEventChecked(item.id, item.checked || false)} style={{ marginRight: 10 }}>
                <Ionicons name={item.checked ? "checkbox" : "square-outline"} size={24} color={getPriorityColor(item.priority || "2")} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, item.checked && { textDecorationLine: "line-through", color: "#999" }]}>{item.title}</Text>
                
                {/* Affichage de l'heure */}
                {item.time && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={[styles.taskTime, item.checked && { color: "#999" }, { marginLeft: 4 }]}>{item.time}</Text>
                  </View>
                )}
                
                {/* Affichage de la personne assignée */}
                {item.assignedTo && usersMap[item.assignedTo] && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    {item.isRotation && <Ionicons name="repeat-outline" size={14} color="#ff9800" style={{ marginRight: 4 }} />}
                    <Ionicons name="person-outline" size={14} color="#ffbf00" />
                    <Text style={[styles.taskTime, item.checked && { color: "#999" }, { color: "#ffbf00", fontWeight: "600", marginLeft: 4 }]}>
                      {usersMap[item.assignedTo].firstName} {usersMap[item.assignedTo].lastName}
                    </Text>
                  </View>
                )}
                
                {/* Affichage des rappels */}
                {item.reminders && item.reminders.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    {item.reminders.map((reminder: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                        <Ionicons name="notifications-outline" size={14} color="#2196F3" />
                        <Text style={{ fontSize: 11, color: "#2196F3", marginLeft: 4 }}>
                          {reminder.date} à {reminder.time}
                          {reminder.message && ` - ${reminder.message}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {item.assignedTo && usersMap[item.assignedTo] && (
                  <TouchableOpacity onPress={() => {
                    const assignedUser = usersMap[item.assignedTo!];
                    alert(`Rappel envoyé à ${assignedUser.firstName} ${assignedUser.lastName} pour la tâche "${item.title}"`);
                  }}>
                    <Ionicons name="notifications" size={20} color="#2196F3" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => {
                  setEventTitle(item.title);
                  setEventDate(selectedDate);
                  setEventTime(item.time);
                  setEventDescription(item.description || "");
                  setEventPoints(item.points?.toString() || "");
                  setEventPriority(item.priority || "2");
                  setEventAssignedTo(item.assignedTo || "");
                  setEventIsRotation(item.isRotation || false);
                  setEventRotationMembers(item.rotationMembers || []);
                  setEventIsRecurring(item.isRecurring || false);
                  setEventRecurrenceType(item.recurrenceType || "weekly");
                  setEventSelectedDays(item.selectedDays || []);
                  setEventMonthlyDay(item.monthlyDay || 1);
                  setEventReminders(item.reminders || []);
                  setEditingIndex(index);
                  setEditingEventId(item.id);
                  setIsEditing(true);
                  setModalVisible(true);
                }}>
                  <Ionicons name="pencil" size={20} color="orange" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteEvent(item.id)}>
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          ));
          })()}
        </View>
      )}

      {/* Menu déroulant de couleur - conteneur séparé à gauche */}
      <View style={{ position: 'absolute', top: 10, left: 20, zIndex: 999 }}>
        <View style={{ 
          borderWidth: 1, 
          borderColor: '#e0e0e0', 
          borderRadius: 12, 
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          overflow: 'hidden',
          width: 45
        }}>
          <Picker
            selectedValue={calendarTheme}
            onValueChange={(value) => setCalendarTheme(value as string)}
            style={{ height: 40, fontSize: 14 }}
          >
            <Picker.Item label="🟡" value="#ffbf00" />
            <Picker.Item label="🔵"  value="#2196F3" />
            <Picker.Item label="🟢" value="#4CAF50" />
          </Picker>
        </View>
      </View>

      {/* Bouton + - conteneur séparé à droite */}
      <View style={{ position: 'absolute', top: 10, right: 20, zIndex: 999 }}>
        <TouchableOpacity onPress={() => { 
          setIsEditing(false);
          setModalVisible(true)
          setEventTitle("");
          setEventDate("");
          setEventTime("");
          setEditingIndex(null);
          
          }} style={styles.addButton}> 
            <Ionicons name="add" size={30} color="#ffbf00ff" /> 
        </TouchableOpacity>
      </View> 


      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalBackground}> 
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={styles.modalContent}>
           <Text style={{ fontSize: 18, marginBottom: 10, fontWeight: "bold" }}>
            {isEditing ? "Modifier l'événement" : "Ajouter un événement"}
             </Text>

            <TextInput 
              placeholder="Titre"
              value={eventTitle}
              onChangeText={setEventTitle} 
              style={styles.inputWeb}
            />
            
            <TextInput 
              placeholder="Description (optionnel)"
              value={eventDescription}
              onChangeText={setEventDescription} 
              style={styles.inputWeb}
              multiline
              numberOfLines={3}
            />
            
            <input 
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}  
              style={styles.inputWeb}
            />
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)} 
              style={styles.inputWeb}
            />
            
            <TextInput 
              placeholder="Points accordés (optionnel)"
              value={eventPoints}
              onChangeText={setEventPoints}
              keyboardType="numeric" 
              style={styles.inputWeb}
            />

            <Text style={{ fontSize: 14, marginTop: 10, marginBottom: 5, fontWeight: "600" }}>Priorité</Text>
            <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 10, overflow: "hidden" }}>
              <Picker
                selectedValue={eventPriority}
                onValueChange={(value) => setEventPriority(value)}
                style={{ height: 45 }}
              >
                <Picker.Item label="🟢 Basse" value="1" />
                <Picker.Item label="🔵 Normale" value="2" />
                <Picker.Item label="🟠 Élevée" value="3" />
                <Picker.Item label="🔴 Urgente" value="4" />
              </Picker>
            </View>

            {(selectedCalendarType === "family" && familyMembers.length > 0) && (
              <>
                <Text style={{ fontSize: 14, marginTop: 10, marginBottom: 5, fontWeight: "600" }}>Assigner à</Text>
                <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 10, overflow: "hidden" }}>
                  <Picker
                    selectedValue={eventAssignedTo}
                    onValueChange={(value) => setEventAssignedTo(value)}
                    style={{ height: 45 }}
                  >
                    <Picker.Item label="Personne (tâche commune)" value="" />
                    {familyMembers.map(member => (
                      <Picker.Item 
                        key={member.uid} 
                        label={`${member.firstName} ${member.lastName}`} 
                        value={member.uid} 
                      />
                    ))}
                  </Picker>
                </View>

                {eventAssignedTo && (
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity 
                      onPress={() => setEventIsRotation(!eventIsRotation)}
                      style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#f0f0f0", borderRadius: 8 }}
                    >
                      <Ionicons 
                        name={eventIsRotation ? "checkbox" : "square-outline"} 
                        size={24} 
                        color="#ffbf00" 
                      />
                      <Text style={{ marginLeft: 8, fontSize: 14 }}>Activer la rotation (tournante)</Text>
                    </TouchableOpacity>
                    
                    {eventIsRotation && (
                      <View style={{ marginTop: 10, padding: 10, backgroundColor: "#fff3cd", borderRadius: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
                          Membres de la tournante:
                        </Text>
                        {familyMembers.map(member => (
                          <TouchableOpacity
                            key={member.uid}
                            onPress={() => {
                              if (eventRotationMembers.includes(member.uid)) {
                                setEventRotationMembers(eventRotationMembers.filter(uid => uid !== member.uid));
                              } else {
                                setEventRotationMembers([...eventRotationMembers, member.uid]);
                              }
                            }}
                            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}
                          >
                            <Ionicons 
                              name={eventRotationMembers.includes(member.uid) ? "checkbox" : "square-outline"} 
                              size={20} 
                              color="#ff9800" 
                            />
                            <Text style={{ marginLeft: 8, fontSize: 13 }}>
                              {member.firstName} {member.lastName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}

            <View style={{ marginTop: 15 }}>
              <TouchableOpacity 
                onPress={() => setEventIsRecurring(!eventIsRecurring)}
                style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#f0f0f0", borderRadius: 8 }}
              >
                <Ionicons 
                  name={eventIsRecurring ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#2196F3" 
                />
                <Text style={{ marginLeft: 8, fontSize: 14 }}>Activer la récurrence</Text>
              </TouchableOpacity>

              {eventIsRecurring && (
                <View style={{ marginTop: 10, padding: 10, backgroundColor: "#e3f2fd", borderRadius: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Type de récurrence:</Text>
                  <View style={{ borderWidth: 1, borderColor: "#2196F3", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                    <Picker
                      selectedValue={eventRecurrenceType}
                      onValueChange={(value) => setEventRecurrenceType(value as "daily" | "weekly" | "monthly")}
                      style={{ height: 40 }}
                    >
                      <Picker.Item label="Quotidien" value="daily" />
                      <Picker.Item label="Hebdomadaire" value="weekly" />
                      <Picker.Item label="Mensuel" value="monthly" />
                    </Picker>
                  </View>

                  {eventRecurrenceType === "weekly" && (
                    <View>
                      <Text style={{ fontSize: 12, marginBottom: 8 }}>Jours de la semaine:</Text>
                      {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            if (eventSelectedDays.includes(index)) {
                              setEventSelectedDays(eventSelectedDays.filter(d => d !== index));
                            } else {
                              setEventSelectedDays([...eventSelectedDays, index]);
                            }
                          }}
                          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 3 }}
                        >
                          <Ionicons 
                            name={eventSelectedDays.includes(index) ? "checkbox" : "square-outline"} 
                            size={18} 
                            color="#2196F3" 
                          />
                          <Text style={{ marginLeft: 6, fontSize: 12 }}>{day}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {eventRecurrenceType === "monthly" && (
                    <View>
                      <Text style={{ fontSize: 12, marginBottom: 5 }}>Jour du mois:</Text>
                      <TextInput
                        value={eventMonthlyDay.toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 1;
                          setEventMonthlyDay(Math.min(31, Math.max(1, num)));
                        }}
                        keyboardType="numeric"
                        style={{ borderWidth: 1, borderColor: "#2196F3", borderRadius: 5, padding: 8, fontSize: 12 }}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Rappels */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity 
                onPress={() => setRemindersEnabled(!remindersEnabled)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: "#ffc107",
                  marginRight: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: remindersEnabled ? "#ffc107" : "transparent"
                }}>
                  {remindersEnabled && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>Rappels</Text>
              </TouchableOpacity>

              {remindersEnabled && (
                <>

                  {/* Liste des rappels existants */}
                  {eventReminders.map((reminder, index) => (
                <View key={index} style={{ 
                  backgroundColor: "#fff",
                  padding: 15,
                  borderRadius: 10,
                  marginBottom: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>Rappel {index + 1}</Text>
                    <TouchableOpacity onPress={() => {
                      setEventReminders(eventReminders.filter((_, i) => i !== index));
                    }}>
                      <Ionicons name="close" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Date et heure :</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ 
                      flex: 1,
                      borderWidth: 1.5, 
                      borderColor: "#ffc107", 
                      padding: 10, 
                      borderRadius: 8,
                      backgroundColor: "#fff"
                    }}>
                      <Text style={{ fontSize: 14, color: "#333" }}>{reminder.date}</Text>
                    </View>
                    <View style={{ 
                      flex: 1,
                      borderWidth: 1.5, 
                      borderColor: "#ffc107", 
                      padding: 10, 
                      borderRadius: 8,
                      backgroundColor: "#fff"
                    }}>
                      <Text style={{ fontSize: 14, color: "#333" }}>{reminder.time}</Text>
                    </View>
                  </View>
                </View>
                  ))}

                  {/* Formulaire d'ajout de rappel */}
                  <View style={{ 
                    backgroundColor: "#fff", 
                    padding: 15, 
                    borderRadius: 10,
                    marginBottom: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 }}>Rappel {eventReminders.length + 1}</Text>
                    <Text style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Date et heure :</Text>
                  
                  <View style={{ flexDirection: "row", marginBottom: 12 }}>
                    <input
                      type="date"
                      value={reminderDate ? (() => {
                        const parts = reminderDate.split('/');
                        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                      })() : ''}
                      onChange={(e) => {
                        const dateParts = e.target.value.split('-');
                        if (dateParts.length === 3) {
                          setReminderDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                        }
                      }}
                      placeholder="jj / mm / aaaa"
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: '#ffc107',
                        padding: 10,
                        borderRadius: 8,
                        fontSize: 14,
                        backgroundColor: '#fff',
                        marginRight: 8
                      }}
                    />
                    <TextInput
                      style={{ 
                        flex: 1,
                        borderWidth: 1.5, 
                        borderColor: '#ffc107', 
                        padding: 10, 
                        borderRadius: 8,
                        fontSize: 14,
                        backgroundColor: '#fff'
                      }}
                      placeholder="HH:MM"
                      placeholderTextColor="#999"
                      value={reminderTime}
                      onChangeText={(text) => {
                        let formatted = text.replace(/[^0-9]/g, '');
                        if (formatted.length >= 2) {
                          formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                        }
                        setReminderTime(formatted);
                      }}
                      maxLength={5}
                    />
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => {
                      if (reminderDate && reminderTime) {
                        setEventReminders([...eventReminders, {
                          date: reminderDate,
                          time: reminderTime
                        }]);
                        setReminderDate("");
                        setReminderTime("");
                      } else {
                        alert("Veuillez remplir la date et l'heure du rappel");
                      }
                    }}
                    style={{
                      backgroundColor: "#ffc107",
                      padding: 12,
                      borderRadius: 8,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>Ajouter</Text>
                  </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                // Réinitialiser tous les champs
                setEventTitle("");
                setEventDate("");
                setEventTime("");
                setEventDescription("");
                setEventPoints("");
                setEventPriority("2");
                setEventAssignedTo("");
                setEventIsRotation(false);
                setEventRotationMembers([]);
                setEventIsRecurring(false);
                setEventRecurrenceType("weekly");
                setEventSelectedDays([]);
                setEventMonthlyDay(1);
                setEventReminders([]);
                setReminderDate("");
                setReminderTime("");
                setReminderMessage("");
                setRemindersEnabled(false);
                setEditingIndex(null);
                setEditingEventId(null);
              }}> 
                <Ionicons name="close" size={35} color="red" />
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEvent}>
                <Ionicons name="checkmark" size={35} color="green" />
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal transparent visible={modalViewVisible} animationType="slide">
  <View style={styles.modalBackground}>
    <View style={styles.modalContent}>
      <TouchableOpacity 
        onPress={() => setModalViewVisible(false)} 
        style={styles.closeButton} 
      >
        <Ionicons name="close" size={24} color="black" /> 
      </TouchableOpacity>

      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Événements du {selectedDate}
      </Text>

      {items[selectedDate]?.length > 0 ? ( 
       items[selectedDate].map((ev, index) => ( 
    <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}> 
      <Text>- {ev.time} : {ev.title}</Text> 
      <View style={{ flexDirection: "row", gap: 15 }}>
      <TouchableOpacity
        onPress={() => deleteEvent(ev.id)} 
      >
        <Ionicons name="trash" size={18} color="red" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          setEventTitle(ev.title);    
          setEventTime(ev.time);     
          setEventDate(selectedDate);
          setEventDescription(ev.description || "");
          setEventPoints(ev.points?.toString() || "");
          setEventPriority(ev.priority || "2");
          setEventAssignedTo(ev.assignedTo || "");
          setEventIsRotation(ev.isRotation || false);
          setEventRotationMembers(ev.rotationMembers || []);
          setEventIsRecurring(ev.isRecurring || false);
          setEventRecurrenceType(ev.recurrenceType || "weekly");
          setEventSelectedDays(ev.selectedDays || []);
          setEventMonthlyDay(ev.monthlyDay || 1);
          setEventReminders(ev.reminders || []);
          setEditingIndex(index);
          setEditingEventId(ev.id);       
          setModalViewVisible(false); 
          setModalVisible(true);     
          setIsEditing(true);  
        }}
      >
        <Ionicons name="pencil" size={18} color="#ffbf00ff" />
      </TouchableOpacity>
    </View>
    </View> 
  ))
) : (
  <View style={{ alignItems: "center", gap: 15 }}>
  <Text>Pas d'événement</Text>
  <TouchableOpacity
    onPress={() => {
      setModalViewVisible(false);
      setIsEditing(false);
      setEventTitle("");
      setEventDate(selectedDate);
      setEventTime("");
      setEventDescription("");
      setEventPoints("");
      setEventPriority("2");
      setEventAssignedTo("");
      setEventIsRotation(false);
      setEventRotationMembers([]);
      setEventIsRecurring(false);
      setEventRecurrenceType("weekly");
      setEventSelectedDays([]);
      setEventMonthlyDay(1);
      setEventReminders([]);
      setReminderDate("");
      setReminderTime("");
      setReminderMessage("");
      setEditingIndex(null);
      setEditingEventId(null);
      setModalVisible(true);
    }}
    style={{
      backgroundColor: "#ffbf00ff",
      padding: 10,
      borderRadius: 50,
      marginTop: 10
    }}
  >
    <Ionicons name="add" size={26} color="white" />
  </TouchableOpacity>
</View>
)}

    </View>
  </View>
</Modal>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  calendarWrapper: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  calendarContainer: {
    position: "relative",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    paddingBottom: 20,
  },
  tasksContainer: {
    marginTop: 20,
    marginHorizontal: 15,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffbf00",
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffbf00",
    marginBottom: 15,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#ffbf00",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  taskTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  Button: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000088",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: "80%",
  },
  input: {
    borderWidth: 1,
    marginTop: 10,
    padding: 5,
    borderRadius: 10,
    color: "gray",     
  fontStyle: "italic",

  },
  selectText: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 15,
  },
  inputWeb: {
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    color: "gray",
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 20,
  },
  addButton: {
  padding: 10, 
  zIndex: 10, 
},
closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  personFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  personFilterChipActive: {
    backgroundColor: "#ffbf00",
    borderColor: "#ffbf00",
  },
  personFilterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  personFilterTextActive: {
    color: "white",
    fontWeight: "bold",
  }


});
