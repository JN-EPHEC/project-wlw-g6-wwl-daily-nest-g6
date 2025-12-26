import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

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

export default function TodoList() {
  const [todoLists, setTodoLists] = useState<any[]>([]);
  const [newListName, setNewListName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedList, setSelectedList] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPoints, setNewItemPoints] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [newItemTime, setNewItemTime] = useState("");
  const [newItemPriority, setNewItemPriority] = useState("2"); // 1=vert, 2=bleu, 3=orange, 4=rouge
  const [newItemAssignedTo, setNewItemAssignedTo] = useState(""); // UID du membre assigné
  const [isRotation, setIsRotation] = useState(false); // Tournante activée
  const [rotationMembers, setRotationMembers] = useState<string[]>([]); // Membres de la tournante
  const [isRecurring, setIsRecurring] = useState(false); // Récurrence activée
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly"); // Type de récurrence
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // Jours sélectionnés (0=dimanche, 1=lundi, etc.)
  const [monthlyDay, setMonthlyDay] = useState<number>(1); // Jour du mois pour récurrence mensuelle (1-31)
  const [newItemReminders, setNewItemReminders] = useState<Array<{date: string; time: string; message?: string}>>([]); // Rappels
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPoints, setEditPoints] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPriority, setEditPriority] = useState("2");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editIsRotation, setEditIsRotation] = useState(false);
  const [editRotationMembers, setEditRotationMembers] = useState<string[]>([]);
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrenceType, setEditRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [editSelectedDays, setEditSelectedDays] = useState<number[]>([]);
  const [editMonthlyDay, setEditMonthlyDay] = useState<number>(1);
  const [sortBy, setSortBy] = useState<"none" | "priority-desc" | "priority-asc" | "date">("none"); // Tri par priorité ou date

  const [familyMembers, setFamilyMembers] = useState<{ uid: string; firstName: string; lastName: string }[]>([]);
  
  const [selectedTodoType, setSelectedTodoType] = useState("personal");
  const [familiesJoined, setFamiliesJoined] = useState<{ id: string; name: string; ownerId: string; members: string[] }[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const user = auth.currentUser;
  if (!user) return <Text>Chargement...</Text>;
  
  const deleteList = async (list: any) => {
    if (!uid) return;
    
    let path: any;
    if (selectedTodoType === "personal") {
      path = doc(db, "users", uid, "todos", list.id);
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = doc(db, "families", selectedFamily.id, "todos", list.id);
    }
    
    await deleteDoc(path);
  };

  const deleteItem = async (item: any) => {
    if (!uid) return;
    
    let path: any;
    if (selectedTodoType === "personal") {
      path = doc(db, "users", uid, "todos", selectedList.id, "items", item.id);
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = doc(db, "families", selectedFamily.id, "todos", selectedList.id, "items", item.id);
    }
    
    await deleteDoc(path);
  };

  const startEditList = (list: any) => {
    setEditingItem(list);
    setEditText(list.title);
    setEditModalVisible(true);
  };

  const saveListEdit = async () => {
    if (!editText.trim() || !uid) return;
    
    let path: any;
    if (selectedTodoType === "personal") {
      path = doc(db, "users", uid, "todos", editingItem.id);
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = doc(db, "families", selectedFamily.id, "todos", editingItem.id);
    }
    
    await updateDoc(path, {
      title: editText,
    });
    setEditModalVisible(false);
    setEditingItem(null);
    setEditText("");
  };

  const startEditItem = (item: any) => {
    setEditingItem(item);
    setEditText(item.name);
    setEditPoints(item.points?.toString() || "");
    setEditDescription(item.description || "");
    setEditDate(item.date || "");
    setEditTime(item.time || "");
    setEditPriority(item.priority || "2");
    setEditAssignedTo(item.assignedTo || "");
    setEditIsRotation(item.isRotation || false);
    setEditRotationMembers(item.rotationMembers || []);
    setEditIsRecurring(item.isRecurring || false);
    setEditRecurrenceType(item.recurrenceType || "weekly");
    setEditSelectedDays(item.selectedDays || []);
    setEditMonthlyDay(item.monthlyDay || 1);
    setEditModalVisible(true);
  };

  const saveItemEdit = async () => {
    if (!uid) return;
    
    const updatedData: any = {
      name: editText,
      description: editDescription,
      points: parseInt(editPoints) || 0,
      date: editDate,
      time: editTime,
      priority: editPriority,
      assignedTo: editAssignedTo,
      isRotation: editIsRotation,
      rotationMembers: editIsRotation ? editRotationMembers : [],
      isRecurring: editIsRecurring,
      recurrenceType: editIsRecurring ? editRecurrenceType : null,
      selectedDays: editIsRecurring && editRecurrenceType === "weekly" ? editSelectedDays : [],
      monthlyDay: editIsRecurring && editRecurrenceType === "monthly" ? editMonthlyDay : null,
    };

    let todosPath: any;
    let calendarPath: any;
    
    if (selectedTodoType === "personal") {
      todosPath = doc(db, "users", uid, "todos", selectedList.id, "items", editingItem.id);
      calendarPath = collection(db, "users", uid, "calendar");
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      todosPath = doc(db, "families", selectedFamily.id, "todos", selectedList.id, "items", editingItem.id);
      calendarPath = collection(db, "families", selectedFamily.id, "calendar");
    }

    await updateDoc(
      todosPath,
      updatedData
    );

    // Mettre à jour également dans le calendrier si la date existe
    if (editDate) {
      const calendarSnapshot = await getDocs(calendarPath);
      
      // Chercher l'événement existant lié à cette tâche
      let eventId = null;
      calendarSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (data.title === editingItem.name && data.date === editingItem.date) {
          eventId = doc.id;
        }
      });

      if (eventId) {
        const eventPath = selectedTodoType === "personal" 
          ? doc(db, "users", uid, "calendar", eventId)
          : doc(db, "families", selectedFamily.id, "calendar", eventId);
          
        await updateDoc(eventPath, { // calendrier 
          title: editText,
          date: editDate,
          time: editTime,
          points: parseInt(editPoints) || 0,
          priority: editPriority,
        });
      } else {
        // Créer un nouvel événement si la date a été ajoutée
        await addDoc(calendarPath, {
          title: editText,
          date: editDate,
          time: editTime,
          points: parseInt(editPoints) || 0,
          priority: editPriority,
          type: "todo",
        });
      }
    }

    setEditModalVisible(false);
    setEditingItem(null);
    setEditText("");
    setEditDescription("");
    setEditPoints("");
    setEditDate("");
    setEditTime("");
    setEditPriority("2");
    setEditAssignedTo("");
    setEditIsRotation(false);
    setEditRotationMembers([]);
    setEditIsRecurring(false);
    setEditRecurrenceType("weekly");
    setEditSelectedDays([]);
    setEditMonthlyDay(1);
  };

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
    // Reset quand on change de type de liste
    setTodoLists([]);
    setSelectedList(null);
    setItems([]);
  }, [selectedTodoType, selectedFamily]);

  // Charger les familles
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

  useEffect(() => {
    if (!uid) return;

    let unsubscribe: any;

    if (selectedTodoType === "personal") {
      unsubscribe = onSnapshot(
        collection(db, "users", uid, "todos"),
        (snapshot) => {
          const lists: any[] = [];
          snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
          setTodoLists(lists);
        }
      );
    } else if (selectedTodoType === "family" && selectedFamily) {
      unsubscribe = onSnapshot(
        collection(db, "families", selectedFamily.id, "todos"),
        (snapshot) => {
          const lists: any[] = [];
          snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
          setTodoLists(lists);
        }
      );
    }

    return () => unsubscribe && unsubscribe();
  }, [selectedTodoType, selectedFamily, uid]);

  // Charger les membres de la famille
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        // Si mode personnel, ne charger que l'utilisateur actuel
        if (selectedTodoType === "personal") {
          if (!uid) return;
          const userDoc = await getDocs(
            query(collection(db, "users"), where("email", "==", user.email))
          );
          
          const currentUserMembers: { uid: string; firstName: string; lastName: string }[] = [];
          userDoc.forEach(doc => {
            const userData = doc.data();
            currentUserMembers.push({
              uid: doc.id,
              firstName: userData.firstName || "",
              lastName: userData.lastName || ""
            });
          });
          
          setFamilyMembers(currentUserMembers);
          return;
        }

        // Si mode famille, charger les membres de la famille sélectionnée
        if (selectedTodoType === "family" && selectedFamily) {
          const memberEmails = selectedFamily.members || [];
          const allMembers: { uid: string; firstName: string; lastName: string }[] = [];

          // Récupérer les infos de chaque membre
          for (const memberEmail of memberEmails) {
            const usersSnapshot = await getDocs(
              query(collection(db, "users"), where("email", "==", memberEmail))
            );
            
            usersSnapshot.forEach(userDoc => {
              const userData = userDoc.data();
              if (!allMembers.find(m => m.uid === userDoc.id)) {
                allMembers.push({
                  uid: userDoc.id,
                  firstName: userData.firstName || "",
                  lastName: userData.lastName || ""
                });
              }
            });
          }

          setFamilyMembers(allMembers);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
      }
    };

    loadFamilyMembers();
  }, [user.email, selectedTodoType, selectedFamily, uid]);

  const createList = async () => {
    if (!newListName.trim() || !uid) return;
    
    let path: any;
    if (selectedTodoType === "personal") {
      path = collection(db, "users", uid, "todos");
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = collection(db, "families", selectedFamily.id, "todos");
    }
    
    await addDoc(path, {
      title: newListName,
    });
    setNewListName("");
  };

  const openList = (list: any) => {
    setSelectedList(list);
    setModalVisible(true);

    let path: any;
    if (selectedTodoType === "personal" && uid) {
      path = collection(db, "users", uid, "todos", list.id, "items");
    } else if (selectedTodoType === "family" && selectedFamily) {
      path = collection(db, "families", selectedFamily.id, "todos", list.id, "items");
    } else {
      return;
    }

    const unsubscribe = onSnapshot(
      path,
      (snapshot: any) => {
        const loadedItems: any[] = [];
        snapshot.forEach((doc: any) =>
          loadedItems.push({ id: doc.id, ...doc.data() })
        );
        setItems(loadedItems);
      }
    );

    return unsubscribe;
  };

  const addItem = async () => {
    if (!newItem.trim() || !uid) return;
    const points = parseInt(newItemPoints) || 0;
    
    let todosPath: any;
    let calendarPath: any;
    
    if (selectedTodoType === "personal") {
      todosPath = collection(db, "users", uid, "todos", selectedList.id, "items");
      calendarPath = collection(db, "users", uid, "calendar");
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      todosPath = collection(db, "families", selectedFamily.id, "todos", selectedList.id, "items");
      calendarPath = collection(db, "families", selectedFamily.id, "calendar");
    }
    
    // Ajouter la tâche
    const taskDocRef = await addDoc(
      todosPath,
      { 
        name: newItem,
        description: newItemDescription || "",
        checked: false, 
        points: points,
        date: newItemDate || "",
        time: newItemTime || "",
        priority: newItemPriority,
        assignedTo: newItemAssignedTo || "",
        isRotation: isRotation,
        rotationMembers: isRotation ? rotationMembers : [],
        currentRotationIndex: 0,
        isRecurring: isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        selectedDays: isRecurring && recurrenceType === "weekly" ? selectedDays : [],
        monthlyDay: isRecurring && recurrenceType === "monthly" ? monthlyDay : null,
        reminders: newItemReminders,
      }
    );

    // Si récurrence activée, créer les occurrences dans le calendrier
    console.log("🔍 Checking recurrence - isRecurring:", isRecurring, "recurrenceType:", recurrenceType);
    if (isRecurring) {
      console.log("✅ Entering recurrence generation");
      const generateRecurringDates = () => {
        const dates: string[] = [];
        
        // Utiliser la date fournie ou la date du jour
        let startDate: Date;
        if (newItemDate.trim()) {
          const [day, month, year] = newItemDate.split('/').map(Number);
          startDate = new Date(year, month - 1, day);
        } else {
          startDate = new Date(); // Date du jour par défaut
        }
        
        if (recurrenceType === "daily") {
          // Générer 30 jours à partir de la date de début
          for (let i = 0; i < 30; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const yyyy = currentDate.getFullYear();
            dates.push(`${dd}/${mm}/${yyyy}`);
          }
        } else if (recurrenceType === "weekly") {
          // Générer 12 semaines (environ 3 mois)
          for (let week = 0; week < 12; week++) {
            for (const dayOfWeek of selectedDays) {
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + (week * 7));
              
              // Ajuster au jour de la semaine sélectionné
              const currentDay = currentDate.getDay();
              const diff = dayOfWeek - currentDay;
              currentDate.setDate(currentDate.getDate() + diff);
              
              // Ne pas ajouter de dates passées
              if (currentDate >= startDate) {
                const dd = String(currentDate.getDate()).padStart(2, '0');
                const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                const yyyy = currentDate.getFullYear();
                dates.push(`${dd}/${mm}/${yyyy}`);
              }
            }
          }
        } else if (recurrenceType === "monthly") {
          // Générer 12 mois avec le jour sélectionné
          for (let i = 0; i < 12; i++) {
            const currentDate = new Date(startDate);
            currentDate.setMonth(startDate.getMonth() + i);
            currentDate.setDate(monthlyDay); // Utiliser le jour sélectionné
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const yyyy = currentDate.getFullYear();
            dates.push(`${dd}/${mm}/${yyyy}`);
          }
        }
        
        return dates;
      };

      const recurringDates = generateRecurringDates();
      console.log("🔄 Generating recurring events:", recurringDates.length, "dates");
      console.log("🔄 First few dates:", recurringDates.slice(0, 5));
      
      // Ajouter chaque occurrence dans le calendrier
      for (const date of recurringDates) {
        try {
          await addDoc(
            calendarPath,
            {
              title: newItem,
              date: date,
              time: newItemTime || "00:00",
              points: points,
              priority: newItemPriority,
              type: "todo",
              isRecurring: true,
              recurrenceType: recurrenceType,
            }
          );
          console.log("✅ Added recurring event for", date);
        } catch (err) {
          console.error("❌ Error adding recurring event:", err);
        }
      }
      console.log("🔄 Finished adding", recurringDates.length, "recurring events");
    } else if (newItemDate.trim()) {
      // Si pas de récurrence mais une date, ajouter une seule occurrence
      await addDoc(
        calendarPath,
        {
          title: newItem,
          date: newItemDate,
          time: newItemTime || "00:00", 
          points: points,
          priority: newItemPriority, 
          type: "todo", 
        }
      );
    }

    setNewItem("");
    setNewItemDescription("");
    setNewItemPoints("");
    setNewItemDate("");
    setNewItemTime("");
    setNewItemPriority("2");
    setNewItemAssignedTo("");
    setIsRotation(false);
    setRotationMembers([]);
    setIsRecurring(false);
    setRecurrenceType("weekly");
    setSelectedDays([]);
    setMonthlyDay(1);
    setNewItemReminders([]);
    setReminderDate("");
    setReminderTime("");
    setReminderMessage("");
  };

  const toggleItem = async (item: any) => {
    if (!uid) return;
    
    let path: any;
    if (selectedTodoType === "personal") {
      path = doc(db, "users", uid, "todos", selectedList.id, "items", item.id);
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = doc(db, "families", selectedFamily.id, "todos", selectedList.id, "items", item.id);
    }
    
    const newCheckedState = !item.checked;
    await updateDoc(path, { checked: newCheckedState });
    
    // Ajouter ou retirer des points
    if (item.points && item.points > 0) {
      const pointsToAdd = newCheckedState ? item.points : -item.points;
      
      // Déterminer qui reçoit les points
      let targetUserId = uid; // Par défaut, l'utilisateur actuel
      
      // Si la tâche est assignée à quelqu'un, cette personne reçoit les points
      if (item.assignedTo) {
        targetUserId = item.assignedTo;
      }
      
      try {
        if (selectedTodoType === "personal") {
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
            console.log(`✅ ${pointsToAdd} points ajoutés (famille) à ${targetUserId}`);
          } else {
            // Créer le document s'il n'existe pas avec setDoc
            await setDoc(memberDocRef, {
              points: pointsToAdd
            }, { merge: true });
            console.log(`✅ Document créé avec ${pointsToAdd} points pour ${targetUserId}`);
          }
        }
        console.log(`✅ ${pointsToAdd} points ajoutés à l'utilisateur ${targetUserId}`);
      } catch (error) {
        console.error("Erreur lors de l'ajout des points:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Mes Listes de Tâches</Text>

      <View style={{ width: "100%", padding: 10, alignItems: "center" }}>
        <View style={{
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: "white",
          width: "70%",
          boxShadow: "0px 2px 6px rgba(0,0,0,0.15)"
        }}>
          <Picker
            selectedValue={selectedFamily?.id || "personal"}
            onValueChange={(value) => {
              if (value === "personal") {
                setSelectedTodoType("personal");
                setSelectedFamily(null);
              } else {
                const fam = familiesJoined.find(f => f.id === value);
                if (fam) {
                  setSelectedFamily(fam);
                  setSelectedTodoType("family");
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
            <Picker.Item label="Listes personnelles" value="personal" />
            <Picker.Item label="── Listes famille ──" value="" enabled={false} />
            {familiesJoined.map(f => (
              <Picker.Item key={f.id} label={f.name} value={f.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nouvelle liste de tâches"
          value={newListName}
          onChangeText={setNewListName}
          onSubmitEditing={createList}
        />
        <TouchableOpacity onPress={createList}>
          <Ionicons name="add-circle" size={40} color="#ffbf00" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={todoLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <TouchableOpacity onPress={() => openList(item)} style={{ flex: 1 }}>
              <Text style={styles.listText}>{item.title}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => startEditList(item)}>
              <Ionicons name="pencil" size={20} color="orange" style={{ marginRight: 15 }} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteList(item)}>
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="black" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{selectedList?.title}</Text>

            <ScrollView style={{ maxHeight: "80%" }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={true}>
            <View style={[styles.addItemRow, { marginTop: 20 }]}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Ajouter une tâche"
                placeholderTextColor="#ccc"
                value={newItem}
                onChangeText={setNewItem}
              />
              <View style={styles.pointsContainer}>
                <Text style={styles.heartIcon}>❤️</Text>
                <TextInput
                  style={styles.pointsInput}
                  placeholder="Pts"
                  placeholderTextColor="#ccc"
                  value={newItemPoints}
                  onChangeText={setNewItemPoints}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Description */}
            <View style={{ marginTop: 15 }}>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Description (optionnel)"
                placeholderTextColor="#ccc"
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Sélecteur de priorité */}
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 10, color: "#333" }}>Priorité</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  onPress={() => setNewItemPriority("1")}
                  style={[
                    styles.priorityButton,
                    { borderColor: getPriorityColor("1"), backgroundColor: newItemPriority === "1" ? getPriorityColor("1") : "white" }
                  ]}
                >
                  <Text style={{ color: newItemPriority === "1" ? "white" : getPriorityColor("1"), fontWeight: "600" }}>Basse</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setNewItemPriority("2")}
                  style={[
                    styles.priorityButton,
                    { borderColor: getPriorityColor("2"), backgroundColor: newItemPriority === "2" ? getPriorityColor("2") : "white" }
                  ]}
                >
                  <Text style={{ color: newItemPriority === "2" ? "white" : getPriorityColor("2"), fontWeight: "600" }}>Moyenne</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setNewItemPriority("3")}
                  style={[
                    styles.priorityButton,
                    { borderColor: getPriorityColor("3"), backgroundColor: newItemPriority === "3" ? getPriorityColor("3") : "white" }
                  ]}
                >
                  <Text style={{ color: newItemPriority === "3" ? "white" : getPriorityColor("3"), fontWeight: "600" }}>Haute</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setNewItemPriority("4")}
                  style={[
                    styles.priorityButton,
                    { borderColor: getPriorityColor("4"), backgroundColor: newItemPriority === "4" ? getPriorityColor("4") : "white" }
                  ]}
                >
                  <Text style={{ color: newItemPriority === "4" ? "white" : getPriorityColor("4"), fontWeight: "600" }}>Urgente</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sélectionner le membre */}
            {familyMembers.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 10, color: "#333" }}>Assigner à</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newItemAssignedTo}
                    onValueChange={(value) => setNewItemAssignedTo(value)}
                    style={styles.picker}
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
              </View>
            )}

            {/* Tournante entre membres */}
            {selectedTodoType === "family" && familyMembers.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <TouchableOpacity 
                  onPress={() => {
                    setIsRotation(!isRotation);
                    if (!isRotation) {
                      setRotationMembers([]);
                    }
                  }}
                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
                >
                  <Ionicons 
                    name={isRotation ? "checkbox" : "square-outline"} 
                    size={24} 
                    color="#ffbf00" 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>Tournante entre membres</Text>
                </TouchableOpacity>

                {isRotation && (
                  <View style={{ backgroundColor: "#f5f5f5", padding: 10, borderRadius: 10 }}>
                    <Text style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>Sélectionnez les membres :</Text>
                    {familyMembers.map(member => (
                      <TouchableOpacity
                        key={member.uid}
                        onPress={() => {
                          if (rotationMembers.includes(member.uid)) {
                            setRotationMembers(rotationMembers.filter(id => id !== member.uid));
                          } else {
                            setRotationMembers([...rotationMembers, member.uid]);
                          }
                        }}
                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
                      >
                        <Ionicons 
                          name={rotationMembers.includes(member.uid) ? "checkbox" : "square-outline"} 
                          size={22} 
                          color="#ffbf00" 
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{ fontSize: 14, color: "#333" }}>
                          {member.firstName} {member.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={[styles.dateRow, { marginTop: 20 }]}>
              <input
                type="date"
                value={newItemDate ? (() => {
                  // input JJ/MM/AAAA en YYYY-MM-DD 
                  const parts = newItemDate.split('/');
                  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                })() : ''}
                onChange={(e) => {
                  // stockage YYYY-MM-DD en JJ/MM/AAAA
                  const dateParts = e.target.value.split('-');
                  if (dateParts.length === 3) {
                    setNewItemDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                  }
                }}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#ffbf00',
                  padding: 10,
                  borderRadius: 10,
                  fontSize: 16
                }}
              />
              <Ionicons name="time-outline" size={20} color="#ffbf00" style={{ marginLeft: 10, marginRight: 10 }} />
              <TextInput
                style={styles.timeInput}
                placeholder="HH:MM"
                value={newItemTime}
                onChangeText={(text) => {
                  // Auto-formater l'heure
                  let formatted = text.replace(/[^0-9]/g, '');
                  if (formatted.length >= 2) {
                    formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                  }
                  setNewItemTime(formatted);
                }}
                maxLength={5}
              />
            </View>

            {/* Récurrence */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity 
                onPress={() => setIsRecurring(!isRecurring)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
              >
                <Ionicons 
                  name={isRecurring ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#ffbf00" 
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>Tâche récurrente</Text>
              </TouchableOpacity>

              {isRecurring && (
                <View style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 10 }}>
                  {/* Type de récurrence */}
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#333" }}>Fréquence</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <TouchableOpacity
                        onPress={() => setRecurrenceType("daily")}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: "#2196F3", 
                            backgroundColor: recurrenceType === "daily" ? "#2196F3" : "white",
                            flex: 1,
                            marginRight: 5
                          }
                        ]}
                      >
                        <Text style={{ color: recurrenceType === "daily" ? "white" : "#2196F3", fontWeight: "600", fontSize: 12 }}>Quotidien</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => setRecurrenceType("weekly")}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: "#2196F3", 
                            backgroundColor: recurrenceType === "weekly" ? "#2196F3" : "white",
                            flex: 1,
                            marginHorizontal: 5
                          }
                        ]}
                      >
                        <Text style={{ color: recurrenceType === "weekly" ? "white" : "#2196F3", fontWeight: "600", fontSize: 12 }}>Hebdo</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => setRecurrenceType("monthly")}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: "#2196F3", 
                            backgroundColor: recurrenceType === "monthly" ? "#2196F3" : "white",
                            flex: 1,
                            marginLeft: 5
                          }
                        ]}
                      >
                        <Text style={{ color: recurrenceType === "monthly" ? "white" : "#2196F3", fontWeight: "600", fontSize: 12 }}>Mensuel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Sélection des jours (pour hebdomadaire) */}
                  {recurrenceType === "weekly" && (
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#333" }}>Jours de la semaine</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {[
                          { label: "Lun", value: 1 },
                          { label: "Mar", value: 2 },
                          { label: "Mer", value: 3 },
                          { label: "Jeu", value: 4 },
                          { label: "Ven", value: 5 },
                          { label: "Sam", value: 6 },
                          { label: "Dim", value: 0 }
                        ].map(day => (
                          <TouchableOpacity
                            key={day.value}
                            onPress={() => {
                              if (selectedDays.includes(day.value)) {
                                setSelectedDays(selectedDays.filter(d => d !== day.value));
                              } else {
                                setSelectedDays([...selectedDays, day.value]);
                              }
                            }}
                            style={{
                              width: 45,
                              height: 45,
                              borderRadius: 22.5,
                              borderWidth: 2,
                              borderColor: "#ffbf00",
                              backgroundColor: selectedDays.includes(day.value) ? "#ffbf00" : "white",
                              justifyContent: "center",
                              alignItems: "center"
                            }}
                          >
                            <Text style={{ 
                              color: selectedDays.includes(day.value) ? "white" : "#ffbf00", 
                              fontWeight: "600",
                              fontSize: 12
                            }}>
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Sélection du jour du mois (pour mensuel) */}
                  {recurrenceType === "monthly" && (
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#333" }}>Jour du mois</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => setMonthlyDay(day)}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              borderWidth: 2,
                              borderColor: "#ffbf00",
                              backgroundColor: monthlyDay === day ? "#ffbf00" : "white",
                              justifyContent: "center",
                              alignItems: "center"
                            }}
                          >
                            <Text style={{ 
                              color: monthlyDay === day ? "white" : "#ffbf00", 
                              fontWeight: "600",
                              fontSize: 11
                            }}>
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
                  {newItemReminders.map((reminder, index) => (
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
                      setNewItemReminders(newItemReminders.filter((_, i) => i !== index));
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
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 }}>Rappel {newItemReminders.length + 1}</Text>
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
                        setNewItemReminders([...newItemReminders, {
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

            </ScrollView>

            {/* Bouton d'ajout */}
            <TouchableOpacity 
              onPress={addItem} 
              style={{ 
                alignSelf: "center", 
                marginTop: 15, 
                backgroundColor: "#ffbf00", 
                borderRadius: 30, 
                paddingVertical: 12, 
                paddingHorizontal: 30,
                flexDirection: "row",
                alignItems: "center",
                gap: 8
              }}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Ajouter la tâche</Text>
            </TouchableOpacity>

            {/* Filtre */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 15, marginBottom: 10 }}>
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
                  <Picker.Item label="Date" value="date" />
                </Picker>
              </View>
            </View>

            <FlatList
              data={(() => {
                // Fonction de tri des tâches
                let sortedItems = [...items];
                
                // Séparer les tâches cochées et non cochées
                const uncheckedItems = sortedItems.filter(item => !item.checked);
                const checkedItems = sortedItems.filter(item => item.checked);
                
                // Fonction pour appliquer le tri
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
                  } else if (sortBy === "date") {
                    itemsList.sort((a, b) => {
                      if (!a.date && !b.date) return 0;
                      if (!a.date) return 1;
                      if (!b.date) return -1;
                      
                      const parseDate = (dateStr: string) => {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
                        }
                        return 0;
                      };
                      
                      return parseDate(a.date) - parseDate(b.date);
                    });
                  }
                };
                
                // Appliquer le tri sur chaque groupe
                applySorting(uncheckedItems);
                applySorting(checkedItems);
                
                // Combiner: non cochées d'abord, puis cochées
                return [...uncheckedItems, ...checkedItems];
              })()}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={[styles.itemRow, { borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority || "2") }]}>
                  <TouchableOpacity
                    onPress={() => toggleItem(item)}
                    style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
                  >
                    <Ionicons name={item.checked ? "checkbox" : "square-outline"} size={28} color={getPriorityColor(item.priority || "2")} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.itemText, item.checked && { textDecorationLine: "line-through", color: "#b0b0b0" }]}>
                        {item.name}
                      </Text>
                      {item.description && (
                        <Text style={{ fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 2 }}>
                          {item.description}
                        </Text>
                      )}
                      {/*Afficher le membre assigné ou la tournante */}
                      {item.isRotation && item.rotationMembers?.length > 0 ? (
                        <Text style={styles.assignedText}>
                          <Ionicons name="repeat-outline" size={14} color="#ff9800" /> 
                          {" "}Tournante: {item.rotationMembers.map((memberId: string) => {
                            const member = familyMembers.find(m => m.uid === memberId);
                            return member ? `${member.firstName}` : "";
                          }).filter(Boolean).join(", ")}
                        </Text>
                      ) : item.assignedTo ? (
                        <Text style={styles.assignedText}>
                          <Ionicons name="person-outline" size={14} color="#666" /> 
                          {" "}{familyMembers.find(m => m.uid === item.assignedTo)?.firstName || "Membre"} {familyMembers.find(m => m.uid === item.assignedTo)?.lastName || ""}
                        </Text>
                      ) : null}
                      {(item.date || item.time) && (
                        <Text style={styles.dateText}>
                          {item.date && <><Ionicons name="calendar-outline" size={14} color="#666" /> {item.date}</>}
                          {item.date && item.time && " • "}
                          {item.time && <><Ionicons name="time-outline" size={14} color="#666" /> {item.time}</>}
                        </Text>
                      )}
                      {item.isRecurring && (
                        <Text style={styles.dateText}>
                          <Ionicons name="sync-outline" size={14} color="#2196F3" /> 
                          {" "}{item.recurrenceType === "daily" ? "Quotidien" : 
                               item.recurrenceType === "weekly" ? `Hebdo (${item.selectedDays?.map((d: number) => 
                                 ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d]
                               ).join(", ")})` : 
                               `Mensuel (le ${item.monthlyDay || 1})`}
                        </Text>
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
                    {item.points > 0 && (
                      <Text style={styles.pointsBadge}>❤️ {item.points}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => startEditItem(item)}>
                    <Ionicons name="pencil" size={20} color="orange" style={{ marginRight: 15 }} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => deleteItem(item)}>
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 15, width: "80%", maxHeight: "85%" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>
              {editingItem?.name ? "Modifier la tâche" : "Modifier la liste"}
            </Text>

            {/* Si c'est une liste, on affiche seulement le champ nom */}
            {!editingItem?.name && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>Nom de la liste</Text>
                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10, marginBottom: 15 }}
                  placeholder="Nom de la liste"
                />
              </View>
            )}

            {/* Si c'est une tâche, on affiche tous les champs */}
            {editingItem?.name && (
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>Nom de la tâche</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10, marginBottom: 15 }}
              placeholder="Nom de la tâche"
            />

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>Description</Text>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
              style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10, marginBottom: 15, height: 80, textAlignVertical: 'top' }}
              placeholder="Description (optionnel)"
            />

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>Points ❤️</Text>
            <TextInput
              value={editPoints}
              onChangeText={setEditPoints}
              keyboardType="numeric"
              maxLength={3}
              style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10, marginBottom: 15 }}
              placeholder="Points"
            />

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>Priorité</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
              <TouchableOpacity
                onPress={() => setEditPriority("1")}
                style={[
                  styles.priorityButton,
                  { borderColor: getPriorityColor("1"), backgroundColor: editPriority === "1" ? getPriorityColor("1") : "white" }
                ]}
              >
                <Text style={{ color: editPriority === "1" ? "white" : getPriorityColor("1"), fontWeight: "600", fontSize: 12 }}>Basse</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setEditPriority("2")}
                style={[
                  styles.priorityButton,
                  { borderColor: getPriorityColor("2"), backgroundColor: editPriority === "2" ? getPriorityColor("2") : "white" }
                ]}
              >
                <Text style={{ color: editPriority === "2" ? "white" : getPriorityColor("2"), fontWeight: "600", fontSize: 12 }}>Moyenne</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setEditPriority("3")}
                style={[
                  styles.priorityButton,
                  { borderColor: getPriorityColor("3"), backgroundColor: editPriority === "3" ? getPriorityColor("3") : "white" }
                ]}
              >
                <Text style={{ color: editPriority === "3" ? "white" : getPriorityColor("3"), fontWeight: "600", fontSize: 12 }}>Haute</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setEditPriority("4")}
                style={[
                  styles.priorityButton,
                  { borderColor: getPriorityColor("4"), backgroundColor: editPriority === "4" ? getPriorityColor("4") : "white" }
                ]}
              >
                <Text style={{ color: editPriority === "4" ? "white" : getPriorityColor("4"), fontWeight: "600", fontSize: 12 }}>Urgente</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>📅 Date</Text>
                <input
                  type="date"
                  value={editDate ? (() => {
                    // Convertir JJ/MM/AAAA en YYYY-MM-DD pour l'input
                    const parts = editDate.split('/');
                    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                  })() : ''}
                  onChange={(e) => {
                    // Convertir YYYY-MM-DD en JJ/MM/AAAA pour le stockage
                    const dateParts = e.target.value.split('-');
                    if (dateParts.length === 3) {
                      setEditDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                    }
                  }}
                  style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10, width: '100%' }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>⏰ Heure</Text>
                <TextInput
                  value={editTime}
                  onChangeText={(text) => {
                    let formatted = text.replace(/[^0-9]/g, '');
                    if (formatted.length >= 2) {
                      formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
                    }
                    setEditTime(formatted);
                  }}
                  placeholder="HH:MM"
                  maxLength={5}
                  style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10 }}
                />
              </View>
            </View>

            {/* On choisi qui est assigné */}
            {familyMembers.length > 0 && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>Assigner à</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editAssignedTo}
                    onValueChange={(value) => setEditAssignedTo(value)}
                    style={styles.picker}
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
              </View>
            )}

            {/* Rotation */}
            {selectedTodoType === "family" && familyMembers.length > 0 && (
              <View style={{ marginTop: 15, marginBottom: 15 }}>
                <TouchableOpacity 
                  onPress={() => setEditIsRotation(!editIsRotation)}
                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
                >
                  <Ionicons 
                    name={editIsRotation ? "checkbox" : "square-outline"} 
                    size={24} 
                    color="#ffbf00" 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>Tournante entre membres</Text>
                </TouchableOpacity>

                {editIsRotation && (
                  <View style={{ backgroundColor: "#f5f5f5", padding: 10, borderRadius: 10 }}>
                    <Text style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>Sélectionnez les membres :</Text>
                    {familyMembers.map(member => (
                      <TouchableOpacity
                        key={member.uid}
                        onPress={() => {
                          if (editRotationMembers.includes(member.uid)) {
                            setEditRotationMembers(editRotationMembers.filter(id => id !== member.uid));
                          } else {
                            setEditRotationMembers([...editRotationMembers, member.uid]);
                          }
                        }}
                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
                      >
                        <Ionicons 
                          name={editRotationMembers.includes(member.uid) ? "checkbox" : "square-outline"} 
                          size={22} 
                          color="#ffbf00" 
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{ fontSize: 14, color: "#333" }}>
                          {member.firstName} {member.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Récurrence */}
            <View style={{ marginTop: 15, marginBottom: 15 }}>
              <TouchableOpacity 
                onPress={() => setEditIsRecurring(!editIsRecurring)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
              >
                <Ionicons 
                  name={editIsRecurring ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#ffbf00" 
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>Tâche récurrente</Text>
              </TouchableOpacity>

              {editIsRecurring && (
                <View style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 10 }}>
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#333" }}>Fréquence</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <TouchableOpacity
                        onPress={() => setEditRecurrenceType("daily")}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: "#2196F3", 
                            backgroundColor: editRecurrenceType === "daily" ? "#2196F3" : "white",
                            flex: 1,
                            marginRight: 5
                          }
                        ]}
                      >
                        <Text style={{ color: editRecurrenceType === "daily" ? "white" : "#2196F3", fontWeight: "600", fontSize: 12 }}>Quotidien</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => setEditRecurrenceType("weekly")}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: "#2196F3", 
                            backgroundColor: editRecurrenceType === "weekly" ? "#2196F3" : "white",
                            flex: 1,
                            marginHorizontal: 5
                          }
                        ]}
                      >
                        <Text style={{ color: editRecurrenceType === "weekly" ? "white" : "#2196F3", fontWeight: "600", fontSize: 12 }}>Hebdo</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => setEditRecurrenceType("monthly")}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: "#2196F3", 
                            backgroundColor: editRecurrenceType === "monthly" ? "#2196F3" : "white",
                            flex: 1,
                            marginLeft: 5
                          }
                        ]}
                      >
                        <Text style={{ color: editRecurrenceType === "monthly" ? "white" : "#2196F3", fontWeight: "600", fontSize: 12 }}>Mensuel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editRecurrenceType === "weekly" && (
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#333" }}>Jours de la semaine</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {[
                          { label: "Lun", value: 1 },
                          { label: "Mar", value: 2 },
                          { label: "Mer", value: 3 },
                          { label: "Jeu", value: 4 },
                          { label: "Ven", value: 5 },
                          { label: "Sam", value: 6 },
                          { label: "Dim", value: 0 }
                        ].map(day => (
                          <TouchableOpacity
                            key={day.value}
                            onPress={() => {
                              if (editSelectedDays.includes(day.value)) {
                                setEditSelectedDays(editSelectedDays.filter(d => d !== day.value));
                              } else {
                                setEditSelectedDays([...editSelectedDays, day.value]);
                              }
                            }}
                            style={{
                              width: 45,
                              height: 45,
                              borderRadius: 22.5,
                              borderWidth: 2,
                              borderColor: "#ffbf00",
                              backgroundColor: editSelectedDays.includes(day.value) ? "#ffbf00" : "white",
                              justifyContent: "center",
                              alignItems: "center"
                            }}
                          >
                            <Text style={{ 
                              color: editSelectedDays.includes(day.value) ? "white" : "#ffbf00", 
                              fontWeight: "600",
                              fontSize: 12
                            }}>
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {editRecurrenceType === "monthly" && (
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#333" }}>Jour du mois</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => setEditMonthlyDay(day)}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              borderWidth: 2,
                              borderColor: "#ffbf00",
                              backgroundColor: editMonthlyDay === day ? "#ffbf00" : "white",
                              justifyContent: "center",
                              alignItems: "center"
                            }}
                          >
                            <Text style={{ 
                              color: editMonthlyDay === day ? "white" : "#ffbf00", 
                              fontWeight: "600",
                              fontSize: 11
                            }}>
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
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 20 }}>
              <TouchableOpacity onPress={() => {
                setEditModalVisible(false);
                setEditingItem(null);
                setEditText("");
                setEditDescription("");
                setEditPoints("");
                setEditDate("");
                setEditTime("");
                setEditPriority("2");
                setEditAssignedTo("");
                setEditIsRotation(false);
                setEditRotationMembers([]);
                setEditIsRecurring(false);
                setEditRecurrenceType("daily");
                setEditSelectedDays([]);
                setEditMonthlyDay(1);
              }}>
                <Text style={{ fontSize: 15, color: "red", fontWeight: "600" }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={editingItem?.name ? saveItemEdit : saveListEdit}>
                <Text style={{ fontSize: 15, color: "green", fontWeight: "600" }}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 15, color: "#ffbf00" },
  addContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ffbf00",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f4f4f4",
    borderRadius: 10,
    marginTop: 10,
  },
  listText: { fontSize: 18 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: "90%",
    width: "95%",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 15, color: "#ffbf00" },
  addItemRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dateRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ffbf00",
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  timeInput: {
    width: 80,
    borderWidth: 1,
    borderColor: "#ffbf00",
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    textAlign: "center",
  },
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 12, paddingVertical: 8 },
  itemText: { fontSize: 18, flex: 1 },
    assignedText: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 2,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 10,
  },
  heartIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  pointsInput: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
  },
  pointsBadge: {
    fontSize: 14,
    color: "#ff3b30",
    fontWeight: "bold",
    marginLeft: 10,
  },
  priorityButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
});