import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { addDoc, collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

import Carnetfamiliale from "../tabs/Carnetfamiliale";
import chat from "../tabs/chat";
import Home from "../tabs/Home";
import ListeCourse from "../tabs/ListeCourse";
import Recompense from "../tabs/Recompense";
import ToDo from "../tabs/ToDo";


// Fonction pour obtenir la couleur en fonction de la priorité
const getPriorityColor = (priority: string): string => {
  switch(priority) {
    case "1": return "#4CAF50"; // Vert
    case "2": return "#2196F3"; // Bleu
    case "3": return "#FF9800"; // Orange
    case "4": return "#F44336"; // Rouge
    default: return "#2196F3"; // Bleu par défaut
  }
};

export type TabMenuParamList = {
  Home: undefined;
  ToDo: undefined;
  ListeCourse: undefined;
  popUpRac: undefined;
  Carnetfamiliale: undefined;
  Recompense: undefined;
  chat: undefined;
};

const Tab = createBottomTabNavigator<TabMenuParamList>();

export function Acceuil() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalScreen, setModalScreen] = useState<"calendar" | "todo" | "shopping" | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventPriority, setEventPriority] = useState("2");
  
  // États pour la rotation
  const [eventIsRotation, setEventIsRotation] = useState(false);
  const [eventRotationMembers, setEventRotationMembers] = useState<string[]>([]);
  
  // États pour la récurrence
  const [eventIsRecurring, setEventIsRecurring] = useState(false);
  const [eventRecurrenceType, setEventRecurrenceType] = useState<"daily" | "weekly" | "monthly" | null>(null);
  const [eventSelectedDays, setEventSelectedDays] = useState<number[]>([]);
  const [eventMonthlyDay, setEventMonthlyDay] = useState(1);

  const [todoTitle, setTodoTitle] = useState("");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoPerson, setTodoPerson] = useState("");
  const [todoDate, setTodoDate] = useState("");
  const [todoTime, setTodoTime] = useState("");
  const [todoPoints, setTodoPoints] = useState("");
  const [todoPriority, setTodoPriority] = useState("2");
  const [todoAssignedTo, setTodoAssignedTo] = useState("");
  const [todoLists, setTodoLists] = useState<any[]>([]);
  const [selectedTodoList, setSelectedTodoList] = useState<string>("");
  const [selectedTodoType, setSelectedTodoType] = useState<"personal" | "family">("personal");
  const [selectedTodoFamily, setSelectedTodoFamily] = useState<{ id: string; name: string; members?: string[] } | null>(null);
  const [familyMembers, setFamilyMembers] = useState<{ uid: string; firstName: string; lastName: string }[]>([]);
  
  // États pour la récurrence des todos
  const [todoIsRecurring, setTodoIsRecurring] = useState(false);
  const [todoRecurrenceType, setTodoRecurrenceType] = useState<"daily" | "weekly" | "monthly" | null>(null);
  const [todoSelectedDays, setTodoSelectedDays] = useState<number[]>([]);
  const [todoMonthlyDay, setTodoMonthlyDay] = useState(1);
  
  // États pour la rotation des todos
  const [todoIsRotation, setTodoIsRotation] = useState(false);
  const [todoRotationMembers, setTodoRotationMembers] = useState<string[]>([]);

  // États pour les notifications
  const [todoNotificationEnabled, setTodoNotificationEnabled] = useState(false);
  const [todoNotificationTime, setTodoNotificationTime] = useState("15 min avant");

  // États pour les rappels (tableau pour supporter plusieurs rappels)
  const [todoReminders, setTodoReminders] = useState<Array<{
    date: string;
    time: string;
    message: string;
  }>>([]);
  const [todoRemindersEnabled, setTodoRemindersEnabled] = useState(false);
  const [todoReminderDate, setTodoReminderDate] = useState("");
  const [todoReminderTime, setTodoReminderTime] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

const [shoppingLists, setShoppingLists] = useState<any[]>([]);
const [selectedListId, setSelectedListId] = useState<string>("");
const [newListName, setNewListName] = useState("");
const [shoppingItem, setShoppingItem] = useState("");
const [selectedShoppingType, setSelectedShoppingType] = useState<"personal" | "family">("personal");
const [selectedShoppingFamily, setSelectedShoppingFamily] = useState<{ id: string; name: string } | null>(null);



const goBack = () => { setModalScreen (null)};
const [modalVisible, setModalVisible] = useState(false);
const user = auth.currentUser;

const [selectedCalendarType, setSelectedCalendarType] = useState<"personal" | "family">("personal");
const [selectedFamily, setSelectedFamily] = useState<{ id: string; name: string; members?: string[] } | null>(null);
const [familiesJoined, setFamiliesJoined] = useState<{ id: string; name: string; members?: string[] }[]>([]);

 useEffect(() => {
  if (!user?.email) return;

  // Charger TOUTES les familles et filtrer côté client (pour supporter les deux formats)
  const q = query(collection(db, "families"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const allFamilies: any[] = [];
    snapshot.forEach(doc => allFamilies.push({ id: doc.id, ...doc.data() }));
    
    // Filtrer pour ne garder que les familles où l'utilisateur est membre
    const userFamilies = allFamilies.filter((family: any) => {
      const members = family.members || [];
      
      for (const memberItem of members) {
        if (typeof memberItem === 'string' && memberItem === user.email) {
          return true; // Format ancien (string)
        } else if (typeof memberItem === 'object' && memberItem.email === user.email) {
          return true; // Format nouveau ({email, role})
        }
      }
      return false;
    });
    
    setFamiliesJoined(userFamilies);
  });

  return () => unsubscribe();
}, [user?.email]);


useEffect(() => {
  if (!user) return;

  let path: any;
  if (selectedShoppingType === "personal") {
    path = collection(db, "users", user.uid, "shopping");
  } else if (selectedShoppingFamily) {
    path = collection(db, "families", selectedShoppingFamily.id, "shopping");
  } else {
    setShoppingLists([]);
    return;
  }

  const unsubscribe = onSnapshot(path, (snapshot: any) => {
    const lists: any[] = [];
    snapshot.forEach((doc: any) => lists.push({ id: doc.id, ...doc.data() }));
    setShoppingLists(lists);
  });

  return unsubscribe;
}, [user, selectedShoppingType, selectedShoppingFamily]);

useEffect(() => {
  if (!user?.uid) return;

  let unsubscribe: any;

  if (selectedTodoType === "personal") {
    unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "todos"),
      (snapshot) => {
        const lists: any[] = [];
        snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
        setTodoLists(lists);
      }
    );
  } else if (selectedTodoType === "family" && selectedTodoFamily) {
    unsubscribe = onSnapshot(
      collection(db, "families", selectedTodoFamily.id, "todos"),
      (snapshot) => {
        const lists: any[] = [];
        snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
        setTodoLists(lists);
      }
    );
  }

  return () => unsubscribe && unsubscribe();
}, [selectedTodoType, selectedTodoFamily, user?.uid]);

useEffect(() => {
  if (!selectedTodoFamily || selectedTodoType !== "family") {
    setFamilyMembers([]);
    return;
  }

  const loadFamilyMembers = async () => {
    const familyMembers = selectedTodoFamily.members || [];
    const usersSnapshot = await collection(db, "users");
    onSnapshot(usersSnapshot, (snapshot) => {
      const members: { uid: string; firstName: string; lastName: string }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("👤 User data for member:", data.email, data);
        if (data.email && familyMembers.includes(data.email)) {
          members.push({
            uid: doc.id,
            firstName: data.prenom || data.firstName || data.firstname || data.name || "Prénom",
            lastName: data.nom || data.lastName || data.lastname || "",
          });
        }
      });
      setFamilyMembers(members);
    });
  };

  loadFamilyMembers();
}, [selectedTodoFamily, selectedTodoType, user?.email]);

// Charger les membres de la famille pour le calendrier aussi
useEffect(() => {
  if (!selectedFamily || selectedCalendarType !== "family") {
    return;
  }

  const loadCalendarFamilyMembers = async () => {
    const familyMembersEmails = selectedFamily.members || [];
    const usersSnapshot = await collection(db, "users");
    onSnapshot(usersSnapshot, (snapshot) => {
      const members: { uid: string; firstName: string; lastName: string }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email && familyMembersEmails.includes(data.email)) {
          members.push({
            uid: doc.id,
            firstName: data.prenom || data.firstName || data.firstname || data.name || "Prénom",
            lastName: data.nom || data.lastName || data.lastname || "",
          });
        }
      });
      setFamilyMembers(members);
    });
  };

  loadCalendarFamilyMembers();
}, [selectedFamily, selectedCalendarType, user?.email]);


  const renderModalContent = () => {
  
  const saveEvent = async () => {
    if (!eventTitle || !eventTime) {
      alert ("Veuillez remplir au moins le titre et l'heure");
      return;
    }
    try {
    // Convertir YYYY-MM-DD (du calendrier) en JJ/MM/AAAA pour la sauvegarde
    let formattedDate = "";
    if (eventDate) {
      const dateParts = eventDate.split('-');
      formattedDate = dateParts.length === 3 
        ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` 
        : eventDate;
    }
      
    let path: any;

    if (selectedCalendarType === "personal") {
      path = collection(db, "users", user?.uid!, "calendar"); // perso
    } else if (selectedCalendarType === "family" && selectedFamily) {
      path = collection(db, "families", selectedFamily.id, "calendar"); // familial
    } else {
      alert("Sélectionnez un calendrier valide !");
      return;
    }

    // Si récurrence activée, générer les occurrences
    if (eventIsRecurring) {
      const generateRecurringDates = () => {
        const dates: string[] = [];
        
        // Utiliser la date fournie ou la date du jour
        let startDate: Date;
        if (formattedDate) {
          const [day, month, year] = formattedDate.split('/').map(Number);
          startDate = new Date(year, month - 1, day);
        } else {
          startDate = new Date();
        }
        
        if (eventRecurrenceType === "daily") {
          for (let i = 0; i < 30; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const yyyy = currentDate.getFullYear();
            dates.push(`${dd}/${mm}/${yyyy}`);
          }
        } else if (eventRecurrenceType === "weekly") {
          for (let week = 0; week < 12; week++) {
            for (const dayOfWeek of eventSelectedDays) {
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + (week * 7));
              
              const currentDay = currentDate.getDay();
              const diff = dayOfWeek - currentDay;
              currentDate.setDate(currentDate.getDate() + diff);
              
              if (currentDate >= startDate) {
                const dd = String(currentDate.getDate()).padStart(2, '0');
                const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                const yyyy = currentDate.getFullYear();
                dates.push(`${dd}/${mm}/${yyyy}`);
              }
            }
          }
        } else if (eventRecurrenceType === "monthly") {
          for (let i = 0; i < 12; i++) {
            const currentDate = new Date(startDate);
            currentDate.setMonth(startDate.getMonth() + i);
            currentDate.setDate(eventMonthlyDay);
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const yyyy = currentDate.getFullYear();
            dates.push(`${dd}/${mm}/${yyyy}`);
          }
        }
        
        return dates;
      };

      const recurringDates = generateRecurringDates();
      
      // Trier les dates pour s'assurer qu'elles sont dans l'ordre chronologique
      recurringDates.sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/').map(Number);
        const [dayB, monthB, yearB] = b.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
      
      for (let i = 0; i < recurringDates.length; i++) {
        const date = recurringDates[i];
        let assignedTo = "";
        let currentRotationIndex = 0;
        
        // Si rotation activée, assigner à tour de rôle
        if (eventIsRotation && eventRotationMembers.length > 0) {
          currentRotationIndex = i % eventRotationMembers.length;
          assignedTo = eventRotationMembers[currentRotationIndex];
        }
        
        await addDoc(path, {
          title: eventTitle,
          description: eventDescription || "",
          date: date,
          time: eventTime,
          priority: eventPriority,
          isRecurring: true,
          recurrenceType: eventRecurrenceType,
          isRotation: eventIsRotation,
          rotationMembers: eventIsRotation ? eventRotationMembers : [],
          currentRotationIndex: currentRotationIndex,
          assignedTo: assignedTo,
        });
      }
    } else {
      // Événement simple sans récurrence
      await addDoc(path, {
        title: eventTitle,
        description: eventDescription || "",
        date: formattedDate || "",
        time: eventTime,
        priority: eventPriority,
        isRotation: eventIsRotation,
        rotationMembers: eventIsRotation ? eventRotationMembers : [],
      });
    }

    alert("Événement sauvegardé !");

    // reset
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventTime("");
    setEventPriority("2");
    setEventIsRotation(false);
    setEventRotationMembers([]);
    setEventIsRecurring(false);
    setEventRecurrenceType(null);
    setEventSelectedDays([]);
    setEventMonthlyDay(1);
    setModalScreen(null);
    setMenuVisible(false);

  } catch (err) {
    console.log(err);
    alert("Impossible de sauvegarder l'événement.");
  }
};

const saveTodo = async () => {
    if (!todoTitle || !selectedTodoList) {
      alert("Veuillez remplir le titre et sélectionner une liste.");
      return;
    }

    try {
      const points = parseInt(todoPoints) || 0;
      
      let todosPath: any;
      let calendarPath: any;
      
      if (selectedTodoType === "personal") {
        todosPath = collection(db, "users", user?.uid!, "todos", selectedTodoList, "items");
        calendarPath = collection(db, "users", user?.uid!, "calendar");
      } else {
        if (!selectedTodoFamily) return;
        todosPath = collection(db, "families", selectedTodoFamily.id, "todos", selectedTodoList, "items");
        calendarPath = collection(db, "families", selectedTodoFamily.id, "calendar");
      }
      
      // Ajouter la tâche
      const taskDocRef = await addDoc(todosPath, {
        name: todoTitle,
        description: todoDescription || "",
        checked: false,
        points: points,
        date: todoDate || "",
        time: todoTime || "",
        priority: todoPriority,
        assignedTo: todoAssignedTo || "",
        isRotation: todoIsRotation,
        rotationMembers: todoIsRotation ? todoRotationMembers : [],
        currentRotationIndex: 0,
        isRecurring: todoIsRecurring,
        recurrenceType: todoIsRecurring ? todoRecurrenceType : null,
        selectedDays: todoIsRecurring && todoRecurrenceType === "weekly" ? todoSelectedDays : [],
        monthlyDay: todoIsRecurring && todoRecurrenceType === "monthly" ? todoMonthlyDay : null,
        reminders: todoReminders,
      });

      // Si récurrence activée, générer les occurrences dans le calendrier
      if (todoIsRecurring) {
        const generateRecurringDates = () => {
          const dates: string[] = [];
          
          let startDate: Date;
          if (todoDate.trim()) {
            const [day, month, year] = todoDate.split('/').map(Number);
            startDate = new Date(year, month - 1, day);
          } else {
            startDate = new Date();
          }
          
          if (todoRecurrenceType === "daily") {
            for (let i = 0; i < 30; i++) {
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + i);
              const dd = String(currentDate.getDate()).padStart(2, '0');
              const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
              const yyyy = currentDate.getFullYear();
              dates.push(`${dd}/${mm}/${yyyy}`);
            }
          } else if (todoRecurrenceType === "weekly") {
            for (let week = 0; week < 12; week++) {
              for (const dayOfWeek of todoSelectedDays) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7));
                
                const currentDay = currentDate.getDay();
                const diff = dayOfWeek - currentDay;
                currentDate.setDate(currentDate.getDate() + diff);
                
                if (currentDate >= startDate) {
                  const dd = String(currentDate.getDate()).padStart(2, '0');
                  const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                  const yyyy = currentDate.getFullYear();
                  dates.push(`${dd}/${mm}/${yyyy}`);
                }
              }
            }
          } else if (todoRecurrenceType === "monthly") {
            for (let i = 0; i < 12; i++) {
              const currentDate = new Date(startDate);
              currentDate.setMonth(startDate.getMonth() + i);
              currentDate.setDate(todoMonthlyDay);
              const dd = String(currentDate.getDate()).padStart(2, '0');
              const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
              const yyyy = currentDate.getFullYear();
              dates.push(`${dd}/${mm}/${yyyy}`);
            }
          }
          
          return dates;
        };

        const recurringDates = generateRecurringDates();
        
        // Trier les dates pour s'assurer qu'elles sont dans l'ordre chronologique
        recurringDates.sort((a, b) => {
          const [dayA, monthA, yearA] = a.split('/').map(Number);
          const [dayB, monthB, yearB] = b.split('/').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          return dateA.getTime() - dateB.getTime();
        });
        
        for (let i = 0; i < recurringDates.length; i++) {
          const date = recurringDates[i];
          let assignedTo = todoAssignedTo || "";
          let currentRotationIndex = 0;
          
          // Si rotation activée, assigner à tour de rôle
          if (todoIsRotation && todoRotationMembers.length > 0) {
            currentRotationIndex = i % todoRotationMembers.length;
            assignedTo = todoRotationMembers[currentRotationIndex];
          }
          
          await addDoc(calendarPath, {
            title: todoTitle,
            date: date,
            time: todoTime || "00:00",
            points: points,
            priority: todoPriority,
            type: "todo",
            isRecurring: true,
            recurrenceType: todoRecurrenceType,
            isRotation: todoIsRotation,
            rotationMembers: todoIsRotation ? todoRotationMembers : [],
            currentRotationIndex: currentRotationIndex,
            assignedTo: assignedTo,
            reminders: todoReminders,
          });
        }
      } else if (todoDate.trim()) {
        // Si pas de récurrence mais une date, ajouter une seule occurrence
        await addDoc(calendarPath, {
          title: todoTitle,
          date: todoDate,
          time: todoTime || "00:00",
          points: points,
          priority: todoPriority,
          type: "todo",
          assignedTo: todoAssignedTo || "",
          isRotation: todoIsRotation,
          rotationMembers: todoIsRotation ? todoRotationMembers : [],
          reminders: todoReminders,
        });
      }

      alert("Tâche sauvegardée !");
      setTodoTitle("");
      setTodoDescription("");
      setTodoPoints("");
      setTodoDate("");
      setTodoTime("");
      setTodoPriority("2");
      setTodoAssignedTo("");
      setSelectedTodoList("");
      setTodoIsRotation(false);
      setTodoRotationMembers([]);
      setTodoIsRecurring(false);
      setTodoRecurrenceType(null);
      setTodoSelectedDays([]);
      setTodoMonthlyDay(1);
      setTodoNotificationEnabled(false);
      setTodoNotificationTime("15 min avant");
      setTodoReminders([]);
      setTodoRemindersEnabled(false);
      setTodoReminderDate("");
      setTodoReminderTime("");
      setReminderMessage("");
      setModalScreen(null);
      setMenuVisible(false);

    } catch (err) {
      alert("Impossible de sauvegarder la tâche.");
    }
  };

  const saveShopping = async () => {
  if (!shoppingItem) {
    alert("Veuillez remplir le champ produit.");
    return;
  }

  if (selectedShoppingType === "family" && !selectedShoppingFamily) {
    alert("Veuillez sélectionner une famille.");
    return;
  }

  try {
    let listId = selectedListId;

    // Déterminer le chemin de base
    const basePath = selectedShoppingType === "personal"
      ? "users"
      : "families";
    const baseId = selectedShoppingType === "personal"
      ? user?.uid!
      : selectedShoppingFamily!.id;

    if (!selectedListId) {
      // Créer une nouvelle liste
      const newListRef = await addDoc(
        collection(db, basePath, baseId, "shopping"),
        { title: newListName || shoppingItem }
      );
      listId = newListRef.id;
    }

    // Ajouter le produit à la liste
    await addDoc(
      collection(db, basePath, baseId, "shopping", listId, "items"),
      { name: shoppingItem, checked: false }
    );

    alert("Produit ajouté !");
    setShoppingItem("");
    setSelectedListId("");
    setNewListName("");
    setModalScreen(null);
    setMenuVisible(false);
  } catch (err) {
    alert("Impossible de sauvegarder.");
  }
};


    switch (modalScreen) { 

    case "calendar":
      return (
        <View style={{ width: "100%", flex: 1 }}>
          {/* Flèche de retour fixe en haut */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999, padding: 10, backgroundColor: "#FF8C42" }}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back-outline" size={26} color="#fff"/>
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalInnerContainer, { marginTop: 50 }]} contentContainerStyle={{ paddingBottom: 20 }}>
            <Image 
            source={require('../../assets/images/Mascotte_celebration.png')} // Change le nom de l'image ici si c'est une photo différente
            style={styles.smallMascot} 
            resizeMode="contain"
            />
            <Text style={[styles.modalTitle, { fontSize: 25, marginBottom: 10, fontWeight: "normal", fontFamily: "Shrikhand_400Regular" }]}>Nouvel Événement</Text>

            {/* Sélection Personnel / Famille */}
            <Picker
              selectedValue={selectedCalendarType === "personal" ? "personal" : selectedFamily?.id}
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
              style={styles.inputWeb}
            >
              <Picker.Item label="Calendrier personnel" value="personal" />
              <Picker.Item label="--- Calendriers famille ---" value="" enabled={false} />
              {familiesJoined.map(f => (
                <Picker.Item key={f.id} label={f.name} value={f.id} />
              ))}
            </Picker>

            {/* Titre */}
            <TextInput 
              placeholder="Titre..." 
              placeholderTextColor="#fff"
              value={eventTitle} 
              onChangeText={setEventTitle} 
              style={styles.inputWeb} 
            />

            {/* Description */}
            <TextInput 
              placeholder="Description (optionnel)..." 
              placeholderTextColor="#fff"
              value={eventDescription} 
              onChangeText={setEventDescription} 
              multiline
              numberOfLines={3}
              style={[styles.inputWeb, { height: 80, textAlignVertical: "top", paddingTop: 15 }]} 
            />

            {/* Date et Heure */}
            <input 
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}  
              style={styles.inputWeb}
              placeholder="Date (optionnel pour récurrence)"
            />
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)} 
              style={styles.inputWeb}
            />

            {/* Priorité */}
            <Text style={{fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "700", marginBottom: 5, marginTop: 15, color: "#fff" }}>Priorité</Text>
            <Picker
              selectedValue={eventPriority}
              onValueChange={(value) => setEventPriority(value)}
              style={styles.inputWeb}
            >
              <Picker.Item label="🟢 Faible (1)" value="1" />
              <Picker.Item label="🔵 Normale (2)" value="2" />
              <Picker.Item label="🟠 Importante (3)" value="3" />
              <Picker.Item label="🔴 Urgente (4)" value="4" />
            </Picker>

            {/* Rotation */}
            {selectedCalendarType === "family" && selectedFamily && (
              <View style={{ marginTop: 15 }}>
                <TouchableOpacity 
                  onPress={() => setEventIsRotation(!eventIsRotation)}
                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
                >
                  <View style={{ 
                    width: 20, 
                    height: 20, 
                    borderWidth: 2, 
                    borderColor: "#fff", 
                    marginRight: 10,
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    {eventIsRotation && <View style={{ width: 12, height: 12, backgroundColor: "#fff" }} />}
                  </View>
                  <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "600", color: "#fff" }}>Tournante entre membres</Text>
                </TouchableOpacity>

                {eventIsRotation && (
                  <View style={{ marginLeft: 30, marginTop: 10 }}>
                    <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Sélectionnez les membres :</Text>
                    {familyMembers.map((member) => (
                      <TouchableOpacity
                        key={member.uid}
                        onPress={() => {
                          if (eventRotationMembers.includes(member.uid)) {
                            setEventRotationMembers(eventRotationMembers.filter(id => id !== member.uid));
                          } else {
                            setEventRotationMembers([...eventRotationMembers, member.uid]);
                          }
                        }}
                        style={{flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                      >
                        <View style={{ 
                          width: 20, 
                          height: 20, 
                          borderWidth: 2, 
                          borderColor: "#fff", 
                          marginRight: 10,
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          {eventRotationMembers.includes(member.uid) && 
                            <View style={{ width: 12, height: 12, backgroundColor: "#fff" }} />
                          }
                        </View>
                        <Text>{member.firstName} {member.lastName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Récurrence */}
            <View style={{ marginTop: 15 }}>
              <TouchableOpacity 
                onPress={() => setEventIsRecurring(!eventIsRecurring)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
              >
                <View style={{ 
                  width: 20, 
                  height: 20, 
                  borderWidth: 2, 
                  borderColor: "#fff", 
                  marginRight: 10,
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  {eventIsRecurring && <View style={{ width: 12, height: 12, backgroundColor: "#fff" }} />}
                </View>
                <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "600", color:"#fff" }}>Événement récurrent</Text>
              </TouchableOpacity>

              {eventIsRecurring && (
                <View style={{ marginLeft: 30, marginTop: 10 }}>
                  <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Fréquence :</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                    <TouchableOpacity 
                      onPress={() => setEventRecurrenceType("daily")}
                      style={{ 
                        paddingHorizontal: 15, 
                        paddingVertical: 8, 
                        backgroundColor: eventRecurrenceType === "daily" ? "#F64040" : "#f0f0f0",
                        borderRadius: 5 
                      }}
                    >
                      <Text style={{ color: eventRecurrenceType === "daily" ? "white" : "#333" }}>Quotidien</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setEventRecurrenceType("weekly")}
                      style={{ 
                        paddingHorizontal: 15, 
                        paddingVertical: 8, 
                        backgroundColor: eventRecurrenceType === "weekly" ? "#F64040" : "#f0f0f0",
                        borderRadius: 5 
                      }}
                    >
                      <Text style={{ color: eventRecurrenceType === "weekly" ? "white" : "#333" }}>Hebdo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setEventRecurrenceType("monthly")}
                      style={{ 
                        paddingHorizontal: 15, 
                        paddingVertical: 8, 
                        backgroundColor: eventRecurrenceType === "monthly" ? "#F64040" : "#f0f0f0",
                        borderRadius: 5 
                      }}
                    >
                      <Text style={{ color: eventRecurrenceType === "monthly" ? "white" : "#333" }}>Mensuel</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sélection des jours pour hebdomadaire */}
                  {eventRecurrenceType === "weekly" && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Jours de la semaine :</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              if (eventSelectedDays.includes(index)) {
                                setEventSelectedDays(eventSelectedDays.filter(d => d !== index));
                              } else {
                                setEventSelectedDays([...eventSelectedDays, index]);
                              }
                            }}
                            style={{
                              width: 45,
                              height: 45,
                              borderRadius: 22.5,
                              backgroundColor: eventSelectedDays.includes(index) ? "#F64040" : "#f0f0f0",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: eventSelectedDays.includes(index) ? "white" : "#333", fontSize: 12 }}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Sélection du jour pour mensuel */}
                  {eventRecurrenceType === "monthly" && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Jour du mois :</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => setEventMonthlyDay(day)}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: eventMonthlyDay === day ? "#F64040" : "#f0f0f0",
                              justifyContent: "center",
                              alignItems: "center"
                            }}
                          >
                            <Text style={{ color: eventMonthlyDay === day ? "white" : "#333", fontSize: 12 }}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

          </ScrollView>

          {/* Bouton sauvegarder fixe en bas */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 3, backgroundColor: "#FF8C42" }}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveEvent}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "todo":
      return (
        <View style={{ width: "100%", flex: 1 }}>
          {/* Flèche de retour fixe en haut */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999, padding: 10, backgroundColor: "#FF8C42" }}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back-outline" size={26} color="#fff"/>
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalInnerContainer, { marginTop: 50 }]} contentContainerStyle={{ paddingBottom: 30 }}>

          <Text style={[styles.modalTitle, { fontSize: 25, marginBottom: 10, fontWeight: "normal" }]}>Nouvelle Tâche</Text>

          {/* Sélection Personnel / Famille */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#fff" }}>Type de liste</Text>
            <Picker
              selectedValue={selectedTodoType === "personal" ? "personal" : selectedTodoFamily?.id}
              onValueChange={(value) => {
                if (value === "personal") {
                  setSelectedTodoType("personal");
                  setSelectedTodoFamily(null);
                } else {
                  const fam = familiesJoined.find(f => f.id === value);
                  if (fam) {
                    setSelectedTodoFamily(fam);
                    setSelectedTodoType("family");
                  }
                }
              }}
              style={styles.inputWeb}
            >
              <Picker.Item label="Listes personnelles" value="personal" />
              <Picker.Item label="- Listes famille -" value="" enabled={false} />
              {familiesJoined.map(f => (
                <Picker.Item key={f.id} label={f.name} value={f.id} />
              ))}
            </Picker>
          </View>
          {/* Sélection de la liste de tâches */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#fff" }}>Liste de tâches</Text>
            <Picker
              selectedValue={selectedTodoList}
              onValueChange={(value) => setSelectedTodoList(value)}
              style={styles.inputWeb}
            >
              <Picker.Item label="Sélectionnez une liste" value="" />
              {todoLists.map(list => (
                <Picker.Item key={list.id} label={list.title} value={list.id} />
              ))}
            </Picker>
          </View>

          {/* Titre de la tâche */}
          <TextInput 
            placeholder="Titre de la tâche..."
            placeholderTextColor="#fff"
            value={todoTitle}
            onChangeText={setTodoTitle} 
            style={styles.inputWeb} 
          />

          {/* Description */}
          <TextInput 
            placeholder="Description (optionnel)..."
            placeholderTextColor="#fff"
            value={todoDescription}
            onChangeText={setTodoDescription}
            multiline
            numberOfLines={3}
            style={[styles.inputWeb, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]} 
          />

          {/* Points */}
          <TextInput 
            placeholder="Points (optionnel)..."
            placeholderTextColor="#fff"
            value={todoPoints}
            onChangeText={setTodoPoints}
            keyboardType="numeric"
            style={styles.inputWeb} 
          />

          {/* Priorité */}
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "700", marginBottom: 12, color: "#fff" }}>Priorité</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
              <TouchableOpacity
                onPress={() => setTodoPriority("1")}
                style={[
                  styles.priorityButton,
                  { 
                    borderColor: getPriorityColor("1"), 
                    backgroundColor: todoPriority === "1" ? getPriorityColor("1") : "white",
                    flex: 1
                  }
                ]}
              >
                <Text style={{ color: todoPriority === "1" ? "white" : getPriorityColor("1"), fontWeight: "600", fontSize: 12 }}>Basse</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setTodoPriority("2")}
                style={[
                  styles.priorityButton,
                  { 
                    borderColor: getPriorityColor("2"), 
                    backgroundColor: todoPriority === "2" ? getPriorityColor("2") : "white",
                    flex: 1
                  }
                ]}
              >
                <Text style={{ color: todoPriority === "2" ? "white" : getPriorityColor("2"), fontWeight: "600", fontSize: 12 }}>Moyenne</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setTodoPriority("3")}
                style={[
                  styles.priorityButton,
                  { 
                    borderColor: getPriorityColor("3"), 
                    backgroundColor: todoPriority === "3" ? getPriorityColor("3") : "white",
                    flex: 1
                  }
                ]}
              >
                <Text style={{ color: todoPriority === "3" ? "white" : getPriorityColor("3"), fontWeight: "600", fontSize: 12 }}>Haute</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setTodoPriority("4")}
                style={[
                  styles.priorityButton,
                  { 
                    borderColor: getPriorityColor("4"), 
                    backgroundColor: todoPriority === "4" ? getPriorityColor("4") : "white",
                    flex: 1
                  }
                ]}
              >
                <Text style={{ color: todoPriority === "4" ? "white" : getPriorityColor("4"), fontWeight: "600", fontSize: 12 }}>Urgente</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Assigner à (si membres famille disponibles) */}
          {familyMembers.length > 0 && !todoIsRotation && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "700", marginBottom: 5, color: "#fff" }}>Assigner à</Text>
              <Picker
                selectedValue={todoAssignedTo}
                onValueChange={(value) => setTodoAssignedTo(value)}
                style={styles.inputWeb}
              >
                <Picker.Item label="Moi-même" value="" />
                {familyMembers.map(member => (
                  <Picker.Item 
                    key={member.uid} 
                    label={`${member.firstName} ${member.lastName}`} 
                    value={member.uid} 
                  />
                ))}
              </Picker>
            </View>
          )}

          {/* Date et heure */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "700", marginBottom: 12, color: "#fff" }}>Date et heure (optionnel)</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <input
                type="date"
                value={todoDate ? (() => {
                  const parts = todoDate.split('/');
                  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                })() : ''}
                onChange={(e) => {
                  const dateParts = e.target.value.split('-');
                  if (dateParts.length === 3) {
                    setTodoDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                  }
                }}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#fff',
                  padding: 10,
                  borderRadius: 10,
                  fontSize: 14,
                  paddingLeft: 20,
                }}
              />
            </View>
            <TextInput
              style={styles.inputWeb}
              placeholder="HH:MM"
              placeholderTextColor="#fff"
              value={todoTime}
              onChangeText={(text) => {
                let formatted = text.replace(/[^0-9]/g, '');
                if (formatted.length >= 2) {
                  formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                }
                setTodoTime(formatted);
              }}
              maxLength={5}
            />
          </View>

          {/* Rotation */}
          {selectedTodoType === "family" && familyMembers.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <TouchableOpacity 
                onPress={() => setTodoIsRotation(!todoIsRotation)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
              >
                <View style={{ 
                  width: 20, 
                  height: 20, 
                  borderWidth: 2, 
                  borderColor: "#fff", 
                  marginRight: 10,
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  {todoIsRotation && <View style={{ width: 12, height: 12, backgroundColor: "#fff" }} />}
                </View>
                <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "600", color: "#fff" }}>Tournante entre membres</Text>
              </TouchableOpacity>

              {todoIsRotation && (
                <View style={{ marginLeft: 30, marginTop: 10 }}>
                  <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Sélectionnez les membres :</Text>
                  {familyMembers.map((member) => (
                    <TouchableOpacity
                      key={member.uid}
                      onPress={() => {
                        if (todoRotationMembers.includes(member.uid)) {
                          setTodoRotationMembers(todoRotationMembers.filter(id => id !== member.uid));
                        } else {
                          setTodoRotationMembers([...todoRotationMembers, member.uid]);
                        }
                      }}
                      style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                    >
                      <View style={{ 
                        width: 20, 
                        height: 20, 
                        borderWidth: 2, 
                        borderColor: "#fff", 
                        marginRight: 10,
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        {todoRotationMembers.includes(member.uid) && 
                          <View style={{ width: 12, height: 12, backgroundColor: "#fff" }} />
                        }
                      </View>
                      <Text>{member.firstName} {member.lastName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Récurrence */}
          <View style={{ marginTop: 15 }}>
            <TouchableOpacity 
              onPress={() => setTodoIsRecurring(!todoIsRecurring)}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
            >
              <View style={{ 
                width: 20, 
                height: 20, 
                borderWidth: 2, 
                borderColor: "#fff", 
                marginRight: 10,
                justifyContent: "center",
                alignItems: "center"
              }}>
                {todoIsRecurring && <View style={{ width: 12, height: 12, backgroundColor: "#fff" }} />}
              </View>
              <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "600", color: "#fff" }}>Tâche récurrente</Text>
            </TouchableOpacity>

            {todoIsRecurring && (
              <View style={{ marginLeft: 30, marginTop: 10 }}>
                <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Fréquence :</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                  <TouchableOpacity
                    onPress={() => setTodoRecurrenceType("daily")}
                    style={[
                      styles.priorityButton,
                      { 
                        borderColor: "#fff", 
                        backgroundColor: todoRecurrenceType === "daily" ? "#F64040" : "white",
                        flex: 1
                      }
                    ]}
                  >
                    <Text style={{ color: todoRecurrenceType === "daily" ? "white" : "#000", fontWeight: "600", fontSize: 12 }}>Quotidien</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTodoRecurrenceType("weekly")}
                    style={[
                      styles.priorityButton,
                      { 
                        borderColor: "#fff", 
                        backgroundColor: todoRecurrenceType === "weekly" ? "#F64040" : "white",
                        flex: 1
                      }
                    ]}
                  >
                    <Text style={{ color: todoRecurrenceType === "weekly" ? "white" : "#000", fontWeight: "600", fontSize: 12 }}>Hebdomadaire</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTodoRecurrenceType("monthly")}
                    style={[
                      styles.priorityButton,
                      { 
                        borderColor: "#fff", 
                        backgroundColor: todoRecurrenceType === "monthly" ? "#F64040" : "white",
                        flex: 1
                      }
                    ]}
                  >
                    <Text style={{ color: todoRecurrenceType === "monthly" ? "white" : "#000", fontWeight: "600", fontSize: 12 }}>Mensuel</Text>
                  </TouchableOpacity>
                </View>

                {todoRecurrenceType === "weekly" && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Jours de la semaine :</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            if (todoSelectedDays.includes(index)) {
                              setTodoSelectedDays(todoSelectedDays.filter(d => d !== index));
                            } else {
                              setTodoSelectedDays([...todoSelectedDays, index]);
                            }
                          }}
                          style={{
                            backgroundColor: todoSelectedDays.includes(index) ? "#F64040" : "white",
                            borderWidth: 2,
                            borderColor: "#fff",
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: todoSelectedDays.includes(index) ? "white" : "#000", fontSize: 12, fontWeight: "600" }}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {todoRecurrenceType === "monthly" && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 13, marginBottom: 8, color: "#fff" }}>Jour du mois :</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setTodoMonthlyDay(day)}
                          style={{
                            backgroundColor: todoMonthlyDay === day ? "#F64040" : "white",
                            borderWidth: 2,
                            borderColor: "#fff",
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: todoMonthlyDay === day ? "white" : "#000", fontSize: 12 }}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Rappels */}
          <View style={{ marginTop: 15 }}>
            <TouchableOpacity 
              onPress={() => setTodoRemindersEnabled(!todoRemindersEnabled)}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderWidth: 2,
                borderColor: "#fff",
                marginRight: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: todoRemindersEnabled ? "#fff" : "transparent"
              }}>
                {todoRemindersEnabled && <Ionicons name="checkmark" size={16} color="000" />}
              </View>
              <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, fontWeight: "600", color: "#fff" }}>Rappels</Text>
            </TouchableOpacity>

            {todoRemindersEnabled && (
              <>
                {/* Liste des rappels existants */}
                {todoReminders.map((reminder, index) => (
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
                        setTodoReminders(todoReminders.filter((_, i) => i !== index));
                      }}>
                        <Ionicons name="close" size={24} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Date et heure :</Text>
                    <View style={{ flexDirection: "row" }}>
                      <View style={{ 
                        flex: 1,
                        borderWidth: 1.5, 
                        borderColor: "#F64040", 
                        padding: 10, 
                        borderRadius: 8,
                        backgroundColor: "#fff",
                        marginRight: 8
                      }}>
                        <Text style={{ fontSize: 14, color: "#333" }}>{reminder.date}</Text>
                      </View>
                      <View style={{ 
                        flex: 1,
                        borderWidth: 1.5, 
                        borderColor: "#F64040", 
                        padding: 10, 
                        borderRadius: 8,
                        backgroundColor: "#fff"
                      }}>
                        <Text style={{ fontSize: 14, color: "#333" }}>{reminder.time}</Text>
                      </View>
                    </View>
                    {reminder.message && (
                      <View style={{ 
                        marginTop: 8,
                        borderWidth: 1.5, 
                        borderColor: "#F64040", 
                        padding: 10, 
                        borderRadius: 8,
                        backgroundColor: "#fff"
                      }}>
                        <Text style={{ fontSize: 14, color: "#333" }}>{reminder.message}</Text>
                      </View>
                    )}
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
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 }}>Rappel {todoReminders.length + 1}</Text>
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Date et heure :</Text>
                  
                  <View style={{ flexDirection: "row", marginBottom: 12 }}>
                    <input
                      type="date"
                      value={todoReminderDate ? (() => {
                        const parts = todoReminderDate.split('/');
                        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                      })() : ''}
                      onChange={(e) => {
                        const dateParts = e.target.value.split('-');
                        if (dateParts.length === 3) {
                          setTodoReminderDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                        }
                      }}
                      placeholder="jj / mm / aaaa"
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: '#FF8C42',
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
                        borderColor: '#FF8C42', 
                        padding: 10, 
                        borderRadius: 8,
                        fontSize: 14,
                        backgroundColor: '#fff'
                      }}
                      placeholder="HH:MM"
                      placeholderTextColor="#999"
                      value={todoReminderTime}
                      onChangeText={(text) => {
                        let formatted = text.replace(/[^0-9]/g, '');
                        if (formatted.length >= 2) {
                          formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                        }
                        setTodoReminderTime(formatted);
                      }}
                      maxLength={5}
                    />
                  </View>
                  
                  <TextInput
                    style={{ 
                      width: '100%',
                      borderWidth: 1.5, 
                      borderColor: '#FF8C42', 
                      padding: 10, 
                      borderRadius: 8,
                      fontSize: 14,
                      marginBottom: 12,
                      backgroundColor: '#fff'
                    }}
                    placeholder="Description (optionnel)"
                    placeholderTextColor="#999"
                    value={reminderMessage}
                    onChangeText={setReminderMessage}
                    multiline
                    numberOfLines={2}
                  />
                  
                  <TouchableOpacity
                    onPress={() => {
                      if (todoReminderDate && todoReminderTime) {
                        setTodoReminders([...todoReminders, {
                          date: todoReminderDate,
                          time: todoReminderTime,
                          message: reminderMessage
                        }]);
                        setTodoReminderDate("");
                        setTodoReminderTime("");
                        setReminderMessage("");
                      } else {
                        alert("Veuillez remplir la date et l'heure du rappel");
                      }
                    }}
                    style={{
                      backgroundColor: "#F64040",
                      padding: 12,
                      borderRadius: 20,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveTodo}>
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>

        </ScrollView>
        </View>
      );

    case "shopping":
  return (
    <View style={styles.modalInnerContainer}>
      <Image 
          source={require('../../assets/images/Mascotte_happy.png')} 
          style={styles.smallMascot} // Assure-toi d'avoir ce style en bas
          resizeMode="contain"
        />
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.modalTitle}>Nouvelle Liste de Course</Text>

      <Text style={{ fontFamily: "Montserrat_400Regular", fontWeight: "bold", fontSize: 14, marginBottom: 10, color : "#fff" }}>Type de liste</Text>
      <Picker
        selectedValue={selectedShoppingType === "personal" ? "personal" : selectedShoppingFamily?.id}
        onValueChange={(value) => {
          if (value === "personal") {
            setSelectedShoppingType("personal");
            setSelectedShoppingFamily(null);
          } else {
            const fam = familiesJoined.find(f => f.id === value);
            if (fam) {
              setSelectedShoppingFamily(fam);
              setSelectedShoppingType("family");
            }
          }
          setSelectedListId(""); // Reset la liste sélectionnée
        }}
        style={{ backgroundColor: "#rgba(255, 255, 255, 0.2)", marginBottom: 10, borderRadius: 10, fontFamily: "Montserrat_400Regular", fontSize: 13, padding: 10, borderWidth: 1, borderColor: "#fff"}}
      >
        <Picker.Item label="Mes listes personnelles" value="personal" />
        <Picker.Item label="── Listes famille ──" value="" enabled={false} />
        {familiesJoined.map(f => (
          <Picker.Item key={f.id} label={f.name} value={f.id} />
        ))}
      </Picker>

      <Text style={{ fontFamily: "Montserrat_400Regular", fontWeight: "bold", fontSize: 14, marginBottom: 10, color: "#fff" }}>Choisir une liste existante</Text>
      <Picker
  selectedValue={selectedListId}
  onValueChange={(val) => setSelectedListId(val)}
  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", marginBottom: 10, borderRadius: 10, fontFamily: "Montserrat_400Regular", fontSize: 13, padding: 10, borderWidth: 1, borderColor:"#fff" }}
>
  <Picker.Item label="Créer une nouvelle liste" value="" />
  {shoppingLists.map((list) => (
    <Picker.Item key={list.id} label={list.title} value={list.id} />
  ))}
</Picker>

      {!selectedListId && (
        <TextInput
          placeholder="Nom de la nouvelle liste"
          placeholderTextColor={"#fff"}
          value={newListName}
          onChangeText={setNewListName}
          style={styles.inputWeb}
          
        />
      )}

      <TextInput
        placeholder="Nom du produit"
        placeholderTextColor={"#fff"}
        value={shoppingItem}
        onChangeText={setShoppingItem}
        style={styles.inputWeb}
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveShopping}>
        <Text style={styles.saveButtonText}>Sauvegarder</Text>
      </TouchableOpacity>
    </View>
  );

    default:
      return null;
  }
};

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#FF914D",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { height: 60, paddingHorizontal: 0 },
          tabBarItemStyle: { flex: 1, alignItems: "center", justifyContent: "center" },
          tabBarIcon: ({ color }) => {
            let iconName: React.ComponentProps<typeof Ionicons>['name'] = "home-outline";
            if (route.name === "Home") iconName = "home-outline";
            if (route.name === "ToDo") iconName = "list-outline";
            if (route.name === "popUpRac") iconName = "add-circle";
            if (route.name === "ListeCourse") iconName = "cart-outline";
            if (route.name === "Carnetfamiliale") iconName = "people-outline";
            return <Ionicons name={iconName} size={24} color={color} />;
          },        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="ToDo" component={ToDo} />
        <Tab.Screen
          name="popUpRac"
          component={() => null}
          options={{
            tabBarButton: () => (
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={{ position: "absolute", bottom: 20, right: 20, zIndex: 10 }}
              >
                <Ionicons name="add-circle" size={60} color="#FF914D" />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="ListeCourse" component={ListeCourse} />
        <Tab.Screen name="Carnetfamiliale" component={Carnetfamiliale} />
      </Tab.Navigator>

     
      
      <Modal visible={menuVisible} transparent animationType="fade">
        {/* On ferme le menu si on clique en dehors */}
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          
          {/* CAS 1 : C'est le MENU RACCOURCI (Orange) */}
          {!modalScreen && (
            <View style={styles.shortcutPositionContainer}>
              <TouchableOpacity 
                activeOpacity={1} 
                style={styles.shortcutCard} 
                onPress={e => e.stopPropagation()} // Empêche la fermeture si on clique sur la carte
              >
                {/* Mascotte */}
                <Image 
                  source={require('../../assets/images/bird_mascot.png')} 
                  style={styles.mascotImage}
                  resizeMode="contain"
                />

                <Text style={styles.shortcutTitle}>Mon raccourci</Text>
                <Text style={styles.shortcutSubtitle}>
                  Qu'as-tu envie d'ajouter/demander aujourd'hui ?
                </Text>

                <View style={styles.buttonsContainer}>
                  <TouchableOpacity style={styles.outlineButton} onPress={() => setModalScreen("calendar")}>
                    <Ionicons name="add" size={24} color="white" style={{ marginRight: 10 }} />
                    <Text style={styles.outlineButtonText}>Ajouter un événement...</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.outlineButton} onPress={() => setModalScreen("shopping")}>
                    <Ionicons name="add" size={24} color="white" style={{ marginRight: 10 }} />
                    <Text style={styles.outlineButtonText}>Ajouter un produit...</Text>
                  </TouchableOpacity>
                  
                  {/* Exemple 3ème bouton (Rappel ou Tâche) */}
                  <TouchableOpacity style={styles.outlineButton} onPress={() => setModalScreen("todo")}>
                    <Ionicons name="add" size={24} color="white" style={{ marginRight: 10 }} />
                    <Text style={styles.outlineButtonText}>Ajouter une tâche...</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* CAS 2 : C'est un FORMULAIRE (Blanc) - Calendrier/Tâche/Course */}
          {modalScreen && (
            <TouchableOpacity 
              activeOpacity={1} 
              style={styles.formModalContent} // Style différent pour les formulaires
              onPress={e => e.stopPropagation()}
            >
               {/* Bouton fermeture croix */}
              <TouchableOpacity 
                style={{ position: "absolute", top: 15, right: 15, zIndex: 10 }} 
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="close" size={30} color="#333" />
              </TouchableOpacity>

              {renderModalContent()}
            </TouchableOpacity>
          )}

        </TouchableOpacity>
      </Modal>

    </View> 
  );
}

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Acceuil"
        component={Acceuil}
        options={({ navigation }) => ({
          headerTitle: "Mon espace",
          headerTitleAlign: "center",
          headerShadowVisible: false, // Supprime l'ombre et la ligne native
          
          // Style de la BOITE du header (fond, bordure)
          headerStyle: {
            backgroundColor: 'white',
            elevation: 0, // Android
            borderBottomWidth: 0, // iOS
          }, // <--- C'est ici qu'il manquait la fermeture de l'objet headerStyle

          // Style du TEXTE du titre
          headerTitleStyle: {
            fontFamily: "Shrikhand_400Regular", 
            fontSize: 28,
            color: "#FF8C42",
            // fontWeight: 'bold' // Tu peux laisser, mais Shrikhand est déjà gras par défaut
          },

          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={40} style={{ marginLeft: 15, color: "#6DDB31" }} />
            </TouchableOpacity>
          ),

          headerRight: () => (
            <View style={{ flexDirection: "row", marginRight: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate("Recompense")}>
                <Ionicons name="heart-outline" size={27} color="#F64040" style={{ marginRight: 15 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("chat")}>
                <Ionicons name="chatbubble-outline" size={27} color="#6DDB31" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen name="Recompense" component={Recompense} />
      <Stack.Screen name="chat" component={chat} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  // --- LAYOUT MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Le fond grisé
    justifyContent: "flex-end", // On aligne tout vers le bas
    alignItems: "center",
    marginBottom: 60,
  },
  
  // --- RACCOURCI (CARTE ORANGE) ---
  shortcutPositionContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 0, // IMPORTANT: C'est ça qui "colle" la carte au-dessus du bouton + (ajuste si besoin)
  },
  shortcutCard: {
    width: "85%", // Largeur de la carte (pas 100% pour voir les bords arrondis)
    backgroundColor: "#FF8C42", // Orange vif
    borderRadius: 30, // Coins très ronds
    padding: 25,
    paddingTop: 30,
    overflow: "visible", // IMPORTANT: Permet à la mascotte de dépasser du cadre
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  mascotImage: {
    position: "absolute",
    top: 10, // On la remonte pour qu'elle sorte du cadre
    right: -39, // On la décale à droite
    width: 110, 
    height: 110,
    zIndex: 10, // Au-dessus du texte
  },
  shortcutTitle: {
    fontFamily: "Shrikhand_400Regular", // Nom exact de ta police (vérifie si c'est 'Shrikhand' ou 'Shrikhand-Regular')
    fontSize: 28,
    color: "white",
    marginBottom: 5,
    lineHeight: 32,
  },
  shortcutSubtitle: {
    fontFamily: "Montserrat_400Regular", // Idem pour Montserrat
    fontSize: 13,
    color: "white",
    fontStyle: "italic", // Montserrat Italique si dispo
    marginBottom: 25,
    width: "70%", // Pour laisser la place à la mascotte
    lineHeight: 20,
  },
  buttonsContainer: {
    width: "100%",
    gap: 12,
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "white",
    backgroundColor: "rgba(255,255,255,0.15)", // Légère transparence
  },
  outlineButtonText: {
    fontFamily: "Montserrat_400Regular",
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },

  // --- FORMULAIRES (MODE BLANC CLASSIC) ---
  formModalContent: {
    width: "87%",
    height: "95%", // Prend presque tout l'écran
    backgroundColor: "#FF8C42",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 40, // Place pour la croix
    alignItems: "center",
    // On enlève le marginBottom pour que ça colle au bas de l'écran comme une "Sheet"
  },
  
  // --- INPUTS & RESTE (Gardés de ton code précédent) ---
  inputWeb: {
    width: "100%",
    height: 50,
    marginTop: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#000",
    fontSize: 13,
    paddingLeft: 15,
    paddingRight: 15,
    fontFamily: "Montserrat_400Regular",
  },
  saveButton: {
    backgroundColor: "#F64040",
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Montserrat_400Regular",
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: "regular",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Shrikhand_400Regular",
  },
  priorityButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  modalInnerContainer: {
    width: "100%",
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 10,
  },
  smallMascot: {
    position: "absolute", // Pour la placer librement
    top: -45,             // On la remonte pour qu'elle soit à cheval sur le bord
    alignSelf: "center",  // On la centre
    width: 75,            // Taille de l'image
    height: 90,
    zIndex: 100,           // Pour passer au-dessus de tout
    elevation: 100,   // Dit à Android : "Passe devant !"
  },
});