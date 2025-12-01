import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [newItemPoints, setNewItemPoints] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [newItemTime, setNewItemTime] = useState("");
  const [newItemPriority, setNewItemPriority] = useState("2"); // 1=vert, 2=bleu, 3=orange, 4=rouge

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPoints, setEditPoints] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPriority, setEditPriority] = useState("2");
  const [sortBy, setSortBy] = useState<"none" | "priority" | "date">("none"); // Tri par priorité ou date

  const user = auth.currentUser;
  if (!user) return <Text>Chargement...</Text>;
  
  const deleteList = async (list: any) => {
    await deleteDoc(doc(db, "users", user.uid, "todos", list.id));
  };

  const deleteItem = async (item: any) => {
    await deleteDoc(
      doc(db, "users", user.uid, "todos", selectedList.id, "items", item.id)
    );
  };

  const startEditList = (list: any) => {
    setEditingItem(list);
    setEditText(list.title);
    setEditModalVisible(true);
  };

  const saveListEdit = async () => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, "users", user.uid, "todos", editingItem.id), {
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
    setEditDate(item.date || "");
    setEditTime(item.time || "");
    setEditPriority(item.priority || "2");
    setEditModalVisible(true);
  };

  const saveItemEdit = async () => {
    const updatedData: any = {
      name: editText,
      points: parseInt(editPoints) || 0,
      date: editDate,
      time: editTime,
      priority: editPriority,
    };

    await updateDoc(
      doc(db, "users", user.uid, "todos", selectedList.id, "items", editingItem.id),
      updatedData
    );

    // Mettre à jour également dans le calendrier si la date existe
    if (editDate) {
      const calendarRef = collection(db, "users", user.uid, "calendar");
      const calendarSnapshot = await getDocs(calendarRef);
      
      // Chercher l'événement existant lié à cette tâche
      let eventId = null;
      calendarSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.title === editingItem.name && data.date === editingItem.date) {
          eventId = doc.id;
        }
      });

      if (eventId) {
        await updateDoc(doc(db, "users", user.uid, "calendar", eventId), {
          title: editText,
          date: editDate,
          time: editTime,
          points: parseInt(editPoints) || 0,
          priority: editPriority,
        });
      } else {
        // Créer un nouvel événement si la date a été ajoutée
        await addDoc(calendarRef, {
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
    setEditPoints("");
    setEditDate("");
    setEditTime("");
    setEditPriority("2");
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "todos"),
      (snapshot) => {
        const lists: any[] = [];
        snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
        setTodoLists(lists);
      }
    );
    return unsubscribe;
  }, []);

  const createList = async () => {
    if (!newListName.trim()) return;
    await addDoc(collection(db, "users", user.uid, "todos"), {
      title: newListName,
    });
    setNewListName("");
  };

  const openList = (list: any) => {
    setSelectedList(list);
    setModalVisible(true);

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "todos", list.id, "items"),
      (snapshot) => {
        const loadedItems: any[] = [];
        snapshot.forEach((doc) =>
          loadedItems.push({ id: doc.id, ...doc.data() })
        );
        setItems(loadedItems);
      }
    );

    return unsubscribe;
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const points = parseInt(newItemPoints) || 0;
    
    // Ajouter la tâche
    await addDoc(
      collection(db, "users", user.uid, "todos", selectedList.id, "items"),
      { 
        name: newItem, 
        checked: false, 
        points: points,
        date: newItemDate || "",
        time: newItemTime || "",
        priority: newItemPriority, // Garder en string
      }
    );

    // Si une date est spécifiée, ajouter aussi dans le calendrier
    if (newItemDate.trim()) {
      await addDoc(
        collection(db, "users", user.uid, "calendar"),
        {
          title: newItem,
          date: newItemDate, // Garder le format JJ/MM/AAAA
          time: newItemTime || "00:00", // Heure saisie ou par défaut
          points: points,
          priority: newItemPriority, // Garder en string
          type: "todo", // Pour identifier que c'est une tâche
        }
      );
    }

    setNewItem("");
    setNewItemPoints("");
    setNewItemDate("");
    setNewItemTime("");
    setNewItemPriority("2");
  };

  const toggleItem = async (item: any) => {
    await updateDoc(
      doc(db, "users", user.uid, "todos", selectedList.id, "items", item.id),
      { checked: !item.checked }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Mes Listes de Tâches</Text>

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
              style={{ position: "absolute", top: 10, right: 10 }}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="black" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{selectedList?.title}</Text>

            {/* Liste déroulante de tri */}
            <View style={{ marginBottom: 15, marginTop: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>Trier par</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Aucun tri (ordre d'ajout)" value="none" />
                  <Picker.Item label="Par priorité" value="priority" />
                  <Picker.Item label="Par date" value="date" />
                </Picker>
              </View>
            </View>

            <View style={[styles.addItemRow, { marginTop: 20 }]}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Ajouter une tâche"
                value={newItem}
                onChangeText={setNewItem}
              />
              <View style={styles.pointsContainer}>
                <Text style={styles.heartIcon}>❤️</Text>
                <TextInput
                  style={styles.pointsInput}
                  placeholder="Pts"
                  value={newItemPoints}
                  onChangeText={setNewItemPoints}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
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

            <View style={[styles.dateRow, { marginTop: 20 }]}>
              <Ionicons name="calendar-outline" size={20} color="#ffbf00" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.dateInput}
                placeholder="Date (JJ/MM/AAAA)"
                value={newItemDate}
                onChangeText={(text) => {
                  // Auto-formater la date
                  let formatted = text.replace(/[^0-9]/g, '');
                  if (formatted.length >= 2) {
                    formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                  }
                  if (formatted.length >= 5) {
                    formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
                  }
                  setNewItemDate(formatted);
                }}
                maxLength={10}
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
              <TouchableOpacity onPress={addItem} style={{ marginLeft: 10 }}>
                <Ionicons name="add-circle" size={40} color="#ffbf00" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={(() => {
                // Fonction de tri des tâches
                let sortedItems = [...items];
                
                if (sortBy === "priority") {
                  // Tri par priorité : 4 (urgent) → 1 (basse)
                  sortedItems.sort((a, b) => {
                    const priorityA = parseInt(a.priority || "2");
                    const priorityB = parseInt(b.priority || "2");
                    return priorityB - priorityA; // Ordre décroissant
                  });
                } else if (sortBy === "date") {
                  // Tri par date
                  sortedItems.sort((a, b) => {
                    if (!a.date && !b.date) return 0;
                    if (!a.date) return 1; // Pas de date va à la fin
                    if (!b.date) return -1;
                    
                    // Convertir JJ/MM/AAAA en timestamp pour comparer
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
                
                return sortedItems;
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
                      {(item.date || item.time) && (
                        <Text style={styles.dateText}>
                          {item.date && <><Ionicons name="calendar-outline" size={14} color="#666" /> {item.date}</>}
                          {item.date && item.time && " • "}
                          {item.time && <><Ionicons name="time-outline" size={14} color="#666" /> {item.time}</>}
                        </Text>
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
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 15, width: "80%", maxHeight: "80%" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>Modifier la tâche</Text>

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#333" }}>Nom de la tâche</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10, marginBottom: 15 }}
              placeholder="Nom de la tâche"
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
                <TextInput
                  value={editDate}
                  onChangeText={(text) => {
                    let formatted = text.replace(/[^0-9]/g, '');
                    if (formatted.length >= 2) {
                      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                    }
                    if (formatted.length >= 5) {
                      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
                    }
                    setEditDate(formatted);
                  }}
                  placeholder="JJ/MM/AAAA"
                  maxLength={10}
                  style={{ borderWidth: 1, borderColor: "#ffbf00", padding: 10, borderRadius: 10 }}
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

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 20 }}>
              <TouchableOpacity onPress={() => {
                setEditModalVisible(false);
                setEditingItem(null);
                setEditText("");
                setEditPoints("");
                setEditDate("");
                setEditTime("");
                setEditPriority("2");
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
    maxHeight: "80%",
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