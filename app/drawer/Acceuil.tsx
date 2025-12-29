
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { addDoc, collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [todoRemindersCount, setTodoRemindersCount] = useState<number>(0);
  const [todoReminder1Date, setTodoReminder1Date] = useState("");
  const [todoReminder1Time, setTodoReminder1Time] = useState("");
  const [todoReminder2Date, setTodoReminder2Date] = useState("");
  const [todoReminder2Time, setTodoReminder2Time] = useState("");
  const [todoReminder3Date, setTodoReminder3Date] = useState("");
  const [todoReminder3Time, setTodoReminder3Time] = useState("");
  const [familyMembers, setFamilyMembers] = useState<{ uid: string; firstName: string; lastName: string }[]>([]);
  
  // États pour la récurrence des todos
  const [todoIsRecurring, setTodoIsRecurring] = useState(false);
  const [todoRecurrenceType, setTodoRecurrenceType] = useState<"daily" | "weekly" | "monthly" | null>(null);
  const [todoSelectedDays, setTodoSelectedDays] = useState<number[]>([]);
  const [todoMonthlyDay, setTodoMonthlyDay] = useState(1);
  
  // États pour la rotation des todos
  const [todoIsRotation, setTodoIsRotation] = useState(false);
  const [todoRotationMembers, setTodoRotationMembers] = useState<string[]>([]);

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
      console.log("👥 Loaded family members:", members);
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
        console.log("👤 Calendar user data:", data.email, data);
        if (data.email && familyMembersEmails.includes(data.email)) {
          members.push({
            uid: doc.id,
            firstName: data.prenom || data.firstName || data.firstname || data.name || "Prénom",
            lastName: data.nom || data.lastName || data.lastname || "",
          });
        }
      });
      console.log("👥 Loaded calendar family members:", members);
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
      
      // Préparer les rappels
      const reminders = [];
      if (todoRemindersCount >= 1 && todoReminder1Date && todoReminder1Time) {
        reminders.push({ date: todoReminder1Date, time: todoReminder1Time });
      }
      if (todoRemindersCount >= 2 && todoReminder2Date && todoReminder2Time) {
        reminders.push({ date: todoReminder2Date, time: todoReminder2Time });
      }
      if (todoRemindersCount >= 3 && todoReminder3Date && todoReminder3Time) {
        reminders.push({ date: todoReminder3Date, time: todoReminder3Time });
      }
      
      // Ajouter la tâche
      await addDoc(todosPath, {
        name: todoTitle,
        description: todoDescription || "",
        checked: false,
        points: points,
        date: todoDate || "",
        time: todoTime || "",
        priority: todoPriority,
        assignedTo: todoAssignedTo || "",
        reminders: reminders,
        isRotation: todoIsRotation,
        rotationMembers: todoIsRotation ? todoRotationMembers : [],
        currentRotationIndex: 0,
        isRecurring: todoIsRecurring,
        recurrenceType: todoIsRecurring ? todoRecurrenceType : null,
        selectedDays: todoIsRecurring && todoRecurrenceType === "weekly" ? todoSelectedDays : [],
        monthlyDay: todoIsRecurring && todoRecurrenceType === "monthly" ? todoMonthlyDay : null,
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
      setTodoRemindersCount(0);
      setTodoReminder1Date("");
      setTodoReminder1Time("");
      setTodoReminder2Date("");
      setTodoReminder2Time("");
      setTodoReminder3Date("");
      setTodoReminder3Time("");
      setTodoIsRotation(false);
      setTodoRotationMembers([]);
      setTodoIsRecurring(false);
      setTodoRecurrenceType(null);
      setTodoSelectedDays([]);
      setTodoMonthlyDay(1);
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
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999, padding: 10, backgroundColor: "white" }}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back-outline" size={26} color="#00d0ffff"/>
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalInnerContainer, { marginTop: 50 }]} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={[styles.modalTitle, { fontSize: 18, marginBottom: 10, fontWeight: "bold" }]}>Nouvel Événement</Text>

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
              placeholder="Titre" 
              placeholderTextColor="#ccc"
              value={eventTitle} 
              onChangeText={setEventTitle} 
              style={styles.inputWeb} 
            />

            {/* Description */}
            <TextInput 
              placeholder="Description (optionnel)" 
              placeholderTextColor="#ccc"
              value={eventDescription} 
              onChangeText={setEventDescription} 
              multiline
              numberOfLines={3}
              style={[styles.inputWeb, { height: 80, textAlignVertical: "top" }]} 
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
            <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 8, marginTop: 10, color: "#000" }}>Priorité</Text>
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
                    borderColor: "#ffbf00", 
                    marginRight: 10,
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    {eventIsRotation && <View style={{ width: 12, height: 12, backgroundColor: "#ffbf00" }} />}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>Tournante entre membres</Text>
                </TouchableOpacity>

                {eventIsRotation && (
                  <View style={{ marginLeft: 30, marginTop: 10 }}>
                    <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Sélectionnez les membres :</Text>
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
                        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                      >
                        <View style={{ 
                          width: 20, 
                          height: 20, 
                          borderWidth: 2, 
                          borderColor: "#ffbf00", 
                          marginRight: 10,
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          {eventRotationMembers.includes(member.uid) && 
                            <View style={{ width: 12, height: 12, backgroundColor: "#ffbf00" }} />
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
                  borderColor: "#ffbf00", 
                  marginRight: 10,
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  {eventIsRecurring && <View style={{ width: 12, height: 12, backgroundColor: "#ffbf00" }} />}
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>Événement récurrent</Text>
              </TouchableOpacity>

              {eventIsRecurring && (
                <View style={{ marginLeft: 30, marginTop: 10 }}>
                  <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Fréquence :</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                    <TouchableOpacity 
                      onPress={() => setEventRecurrenceType("daily")}
                      style={{ 
                        paddingHorizontal: 15, 
                        paddingVertical: 8, 
                        backgroundColor: eventRecurrenceType === "daily" ? "#ffbf00" : "#f0f0f0",
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
                        backgroundColor: eventRecurrenceType === "weekly" ? "#ffbf00" : "#f0f0f0",
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
                        backgroundColor: eventRecurrenceType === "monthly" ? "#ffbf00" : "#f0f0f0",
                        borderRadius: 5 
                      }}
                    >
                      <Text style={{ color: eventRecurrenceType === "monthly" ? "white" : "#333" }}>Mensuel</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sélection des jours pour hebdomadaire */}
                  {eventRecurrenceType === "weekly" && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Jours de la semaine :</Text>
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
                              backgroundColor: eventSelectedDays.includes(index) ? "#ffbf00" : "#f0f0f0",
                              justifyContent: "center",
                              alignItems: "center"
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
                      <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Jour du mois :</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => setEventMonthlyDay(day)}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: eventMonthlyDay === day ? "#ffbf00" : "#f0f0f0",
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
          <TouchableOpacity 
            style={[styles.saveButton, { position: "absolute", bottom: 20, left: 20, right: 20 }]} 
            onPress={saveEvent}
          >
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      );

    case "todo":
      return (
        <View style={{ width: "100%", flex: 1 }}>
          {/* Flèche de retour fixe en haut */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999, padding: 10, backgroundColor: "white" }}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back-outline" size={26} color="#00d0ffff"/>
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalInnerContainer, { marginTop: 50 }]} contentContainerStyle={{ paddingBottom: 30 }}>

          <Text style={[styles.modalTitle, { fontSize: 18, marginBottom: 10, fontWeight: "bold" }]}>Nouvelle Tâche</Text>

          {/* Sélection Personnel / Famille */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 8, color: "#000" }}>Type de liste</Text>
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
            <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 5, color: "#000" }}>Liste de tâches</Text>
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
            placeholder="Titre de la tâche"
            placeholderTextColor="#ccc"
            value={todoTitle}
            onChangeText={setTodoTitle} 
            style={styles.inputWeb} 
          />

          {/* Description */}
          <TextInput 
            placeholder="Description (optionnel)"
            placeholderTextColor="#ccc"
            value={todoDescription}
            onChangeText={setTodoDescription}
            multiline
            numberOfLines={3}
            style={[styles.inputWeb, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]} 
          />

          {/* Points */}
          <TextInput 
            placeholder="Points (optionnel)"
            placeholderTextColor="#ccc"
            value={todoPoints}
            onChangeText={setTodoPoints}
            keyboardType="numeric"
            style={styles.inputWeb} 
          />

          {/* Priorité */}
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 6, color: "#000" }}>Priorité</Text>
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
              <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 5, color: "#000" }}>Assigner à</Text>
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
            <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 5, color: "#000" }}>Date et heure (optionnel)</Text>
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
                  borderColor: '#00d0ff',
                  padding: 10,
                  borderRadius: 10,
                  fontSize: 14
                }}
              />
            </View>
            <TextInput
              style={styles.inputWeb}
              placeholder="HH:MM"
              placeholderTextColor="#ccc"
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

          {/* Rappels */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 5, color: "#000" }}>Rappels (optionnel)</Text>
            <Picker
              selectedValue={todoRemindersCount}
              onValueChange={(value) => setTodoRemindersCount(value)}
              style={styles.inputWeb}
            >
              <Picker.Item label="Aucun rappel" value={0} />
              <Picker.Item label="1 rappel" value={1} />
              <Picker.Item label="2 rappels" value={2} />
              <Picker.Item label="3 rappels" value={3} />
            </Picker>

            {/* Rappel 1 */}
            {todoRemindersCount >= 1 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", marginBottom: 5, color: "#00d0ff" }}>Rappel 1</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 5 }}>
                  <input
                    type="date"
                    value={todoReminder1Date ? (() => {
                      const parts = todoReminder1Date.split('/');
                      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                    })() : ''}
                    onChange={(e) => {
                      const dateParts = e.target.value.split('-');
                      if (dateParts.length === 3) {
                        setTodoReminder1Date(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                      }
                    }}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#00d0ff',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />
                  <TextInput
                    style={[styles.inputWeb, { flex: 1, marginTop: 0, height: 35, fontSize: 12 }]}
                    placeholder="HH:MM"
                    placeholderTextColor="#ccc"
                    value={todoReminder1Time}
                    onChangeText={(text) => {
                      let formatted = text.replace(/[^0-9]/g, '');
                      if (formatted.length >= 2) {
                        formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                      }
                      setTodoReminder1Time(formatted);
                    }}
                    maxLength={5}
                  />
                </View>
              </View>
            )}

            {/* Rappel 2 */}
            {todoRemindersCount >= 2 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", marginBottom: 5, color: "#666" }}>Rappel 2</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 5 }}>
                  <input
                    type="date"
                    value={todoReminder2Date ? (() => {
                      const parts = todoReminder2Date.split('/');
                      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                    })() : ''}
                    onChange={(e) => {
                      const dateParts = e.target.value.split('-');
                      if (dateParts.length === 3) {
                        setTodoReminder2Date(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                      }
                    }}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#00d0ff',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />
                  <TextInput
                    style={[styles.inputWeb, { flex: 1, marginTop: 0, height: 35, fontSize: 12 }]}
                    placeholder="HH:MM"
                    placeholderTextColor="#ccc"
                    value={todoReminder2Time}
                    onChangeText={(text) => {
                      let formatted = text.replace(/[^0-9]/g, '');
                      if (formatted.length >= 2) {
                        formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                      }
                      setTodoReminder2Time(formatted);
                    }}
                    maxLength={5}
                  />
                </View>
              </View>
            )}

            {/* Rappel 3 */}
            {todoRemindersCount >= 3 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", marginBottom: 5, color: "#666" }}>Rappel 3</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 5 }}>
                  <input
                    type="date"
                    value={todoReminder3Date ? (() => {
                      const parts = todoReminder3Date.split('/');
                      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                    })() : ''}
                    onChange={(e) => {
                      const dateParts = e.target.value.split('-');
                      if (dateParts.length === 3) {
                        setTodoReminder3Date(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                      }
                    }}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#00d0ff',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />
                  <TextInput
                    style={[styles.inputWeb, { flex: 1, marginTop: 0, height: 35, fontSize: 12 }]}
                    placeholder="HH:MM"
                    placeholderTextColor="#ccc"
                    value={todoReminder3Time}
                    onChangeText={(text) => {
                      let formatted = text.replace(/[^0-9]/g, '');
                      if (formatted.length >= 2) {
                        formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                      }
                      setTodoReminder3Time(formatted);
                    }}
                    maxLength={5}
                  />
                </View>
              </View>
            )}
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
                  borderColor: "#ffbf00", 
                  marginRight: 10,
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  {todoIsRotation && <View style={{ width: 12, height: 12, backgroundColor: "#ffbf00" }} />}
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>Tournante entre membres</Text>
              </TouchableOpacity>

              {todoIsRotation && (
                <View style={{ marginLeft: 30, marginTop: 10 }}>
                  <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Sélectionnez les membres :</Text>
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
                        borderColor: "#ffbf00", 
                        marginRight: 10,
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        {todoRotationMembers.includes(member.uid) && 
                          <View style={{ width: 12, height: 12, backgroundColor: "#ffbf00" }} />
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
                borderColor: "#ffbf00", 
                marginRight: 10,
                justifyContent: "center",
                alignItems: "center"
              }}>
                {todoIsRecurring && <View style={{ width: 12, height: 12, backgroundColor: "#ffbf00" }} />}
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600" }}>Tâche récurrente</Text>
            </TouchableOpacity>

            {todoIsRecurring && (
              <View style={{ marginLeft: 30, marginTop: 10 }}>
                <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Fréquence :</Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                  <TouchableOpacity 
                    onPress={() => setTodoRecurrenceType("daily")}
                    style={{ 
                      paddingHorizontal: 15, 
                      paddingVertical: 8, 
                      backgroundColor: todoRecurrenceType === "daily" ? "#ffbf00" : "#f0f0f0",
                      borderRadius: 5 
                    }}
                  >
                    <Text style={{ color: todoRecurrenceType === "daily" ? "white" : "#333" }}>Quotidien</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setTodoRecurrenceType("weekly")}
                    style={{ 
                      paddingHorizontal: 15, 
                      paddingVertical: 8, 
                      backgroundColor: todoRecurrenceType === "weekly" ? "#ffbf00" : "#f0f0f0",
                      borderRadius: 5 
                    }}
                  >
                    <Text style={{ color: todoRecurrenceType === "weekly" ? "white" : "#333" }}>Hebdo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setTodoRecurrenceType("monthly")}
                    style={{ 
                      paddingHorizontal: 15, 
                      paddingVertical: 8, 
                      backgroundColor: todoRecurrenceType === "monthly" ? "#ffbf00" : "#f0f0f0",
                      borderRadius: 5 
                    }}
                  >
                    <Text style={{ color: todoRecurrenceType === "monthly" ? "white" : "#333" }}>Mensuel</Text>
                  </TouchableOpacity>
                </View>

                {/* Jours pour hebdomadaire */}
                {todoRecurrenceType === "weekly" && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Jours de la semaine :</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day, index) => (
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
                            width: 45,
                            height: 45,
                            borderRadius: 22.5,
                            backgroundColor: todoSelectedDays.includes(index) ? "#ffbf00" : "#f0f0f0",
                            justifyContent: "center",
                            alignItems: "center"
                          }}
                        >
                          <Text style={{ color: todoSelectedDays.includes(index) ? "white" : "#333", fontSize: 12 }}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Jour pour mensuel */}
                {todoRecurrenceType === "monthly" && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 13, marginBottom: 8, color: "#666" }}>Jour du mois :</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setTodoMonthlyDay(day)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: todoMonthlyDay === day ? "#ffbf00" : "#f0f0f0",
                            justifyContent: "center",
                            alignItems: "center"
                          }}
                        >
                          <Text style={{ color: todoMonthlyDay === day ? "white" : "#333", fontSize: 12 }}>
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

          <TouchableOpacity style={styles.saveButton} onPress={saveTodo}>
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>

        </ScrollView>
        </View>
      );

    case "shopping":
  return (
    <View style={styles.modalInnerContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back-outline" size={26} color="#00d0ff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.modalTitle}>Nouvelle Liste de Course</Text>

      <Text style={{ fontSize: 16, marginBottom: 5 }}>Type de liste</Text>
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
        style={{ backgroundColor: "#f1f1f1", marginBottom: 10, borderRadius: 10 }}
      >
        <Picker.Item label="Mes listes personnelles" value="personal" />
        <Picker.Item label="── Listes famille ──" value="" enabled={false} />
        {familiesJoined.map(f => (
          <Picker.Item key={f.id} label={f.name} value={f.id} />
        ))}
      </Picker>

      <Text style={{ fontSize: 16, marginBottom: 5 }}>Choisir une liste existante</Text>
      <Picker
  selectedValue={selectedListId}
  onValueChange={(val) => setSelectedListId(val)}
  style={{ backgroundColor: "#f1f1f1", marginBottom: 10, borderRadius: 10 }}
>
  <Picker.Item label="Créer une nouvelle liste" value="" />
  {shoppingLists.map((list) => (
    <Picker.Item key={list.id} label={list.title} value={list.id} />
  ))}
</Picker>

      {!selectedListId && (
        <TextInput
          placeholder="Nom de la nouvelle liste"
          value={newListName}
          onChangeText={setNewListName}
          style={styles.inputWeb}
        />
      )}

      <TextInput
        placeholder="Nom du produit"
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
          tabBarActiveTintColor: "#ffb700ff",
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
                <Ionicons name="add-circle" size={60} color="#ffbf00" />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="ListeCourse" component={ListeCourse} />
        <Tab.Screen name="Carnetfamiliale" component={Carnetfamiliale} />
      </Tab.Navigator>

     
      
      <Modal visible={menuVisible} transparent animationType="slide">
  <TouchableOpacity
    style={styles.modalContainer}
    activeOpacity={1}
    onPress={() => setMenuVisible(false)}  
  >
    <TouchableOpacity
      activeOpacity={1}
      style={styles.modalContent}
      onPress={(e) => e.stopPropagation()}  
    >
      <TouchableOpacity
        style={{ position: "absolute", top: 10, right: 10 }}
        onPress={() => setMenuVisible(false)} 
      >
        <Ionicons name="close" size={30} color="black" />
      </TouchableOpacity>

      {!modalScreen && (
        <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 20 }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalScreen("calendar")}>
            <Ionicons name="calendar-outline" size={30} color="white" />
            <Text style={styles.buttonText}>Événement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalScreen("todo")}>
            <Ionicons name="list-outline" size={30} color="white" />
            <Text style={styles.buttonText}>Tâche</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalScreen("shopping")}>
            <Ionicons name="cart-outline" size={30} color="white" />
            <Text style={styles.buttonText}>Course</Text>
          </TouchableOpacity>
        </View>
      )}

      {modalScreen && renderModalContent()}
    </TouchableOpacity>
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
          headerTitle: "Accueil",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={26} style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", marginRight: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate("Recompense")}>
                <Ionicons name="heart-outline" size={24} color="#ff005d" style={{ marginRight: 15 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("chat")}>
                <Ionicons name="chatbubble-outline" size={24} color="#00ff91" />
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

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },


  modalContent: {
    width: "90%",
    maxHeight: "85%",
    marginTop: 60,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },


  iconButton: {
    backgroundColor: "#00d0ffff",
    borderRadius: 15,
    padding: 10,
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },

  buttonText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: "#eeeeeef4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", 
    padding: 20,
  },
  inputWeb: {
  width: "100%",
  height: 45,               
  marginTop: 10,
  paddingHorizontal: 12,   
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#00d0ffff",
  color: "gray",
  fontStyle: "italic",
  fontSize: 16,
},
  backButton: {
  position: "absolute",
  left: 10,
  top: 10,
  zIndex: 10,
  padding: 5,
},
modalTitle: {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 15,
  color: "#00d0ffff",
  textAlign: "center",
  width: "100%",
},
modalInnerContainer: {
  width: "100%",
  marginBottom: 5,
  paddingHorizontal: 10,
  maxHeight: "100%",
},

modalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: 15,
  position: "relative",
  zIndex: 9999,
},
saveButton: {
  backgroundColor: "#00d0ffff",
  borderRadius: 50,
  paddingVertical: 10,
  paddingHorizontal: 20,
  marginTop: 10,
  alignItems: "center",
},

saveButtonText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 14,
},
closeModalButton: {
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 10,
  padding: 5,
},
priorityButton: {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 8,
  borderWidth: 2,
  alignItems: "center",
  justifyContent: "center",
},






});
