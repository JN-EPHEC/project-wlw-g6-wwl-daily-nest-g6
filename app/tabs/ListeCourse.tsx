import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ShoppingList() {
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [newListName, setNewListName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);

  const [selectedListType, setSelectedListType] = useState<"personal" | "family">("personal");
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);

  const user = auth.currentUser;
  if (!user) return null;

  // Charger les familles
  useEffect(() => {
    if (!user?.email) return;

    const q = query(collection(db, "families"));

    const unsub = onSnapshot(q, (snap) => {
      const allFamilies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Filtrer pour ne garder que les familles où l'utilisateur est membre
      const userFamilies = allFamilies.filter((family: any) => {
        const members = family.members || [];
        
        for (const memberItem of members) {
          if (typeof memberItem === 'string' && memberItem === user.email) {
            return true; // Format ancien
          } else if (typeof memberItem === 'object' && memberItem.email === user.email) {
            return true; // Format nouveau
          }
        }
        return false;
      });
      
      setFamilies(userFamilies);
    });

    return unsub;
  }, [user?.email]);

  // Charger les listes selon type
  useEffect(() => {
    let path = selectedListType === "personal" 
      ? collection(db, "users", user.uid, "shopping")
      : selectedFamily ? collection(db, "families", selectedFamily.id, "shopping") : null;

    if (!path) return;

    const unsubscribe = onSnapshot(path, snapshot => {
      const lists: any[] = [];
      snapshot.forEach(doc => lists.push({ id: doc.id, ...doc.data() }));
      setShoppingLists(lists);
    });
    return unsubscribe;
  }, [selectedListType, selectedFamily]);

  const createList = async () => {
    if (!newListName.trim()) return;
    const path = selectedListType === "personal" 
      ? collection(db, "users", user.uid, "shopping")
      : selectedFamily ? collection(db, "families", selectedFamily.id, "shopping") : null;

    if (!path) return;

    await addDoc(path, { title: newListName });
    setNewListName("");
  };

  const openList = (list: any) => {
    setSelectedList(list);
    setModalVisible(true);

    const path = selectedListType === "personal" 
      ? collection(db, "users", user.uid, "shopping", list.id, "items")
      : selectedFamily ? collection(db, "families", selectedFamily.id, "shopping", list.id, "items") : null;

    if (!path) return;

    const unsubscribe = onSnapshot(path, snapshot => {
      const loadedItems: any[] = [];
      snapshot.forEach(doc => loadedItems.push({ id: doc.id, ...doc.data() }));
      setItems(loadedItems);
    });
    return unsubscribe;
  };

  const addItem = async () => {
    if (!newItem.trim() || !selectedList) return;
    const path = selectedListType === "personal" 
      ? collection(db, "users", user.uid, "shopping", selectedList.id, "items")
      : selectedFamily ? collection(db, "families", selectedFamily.id, "shopping", selectedList.id, "items") : null;
    if (!path) return;
    await addDoc(path, { name: newItem, checked: false });
    setNewItem("");
  };

  const toggleItem = async (item: any) => {
    const path = selectedListType === "personal" 
      ? doc(db, "users", user.uid, "shopping", selectedList.id, "items", item.id)
      : selectedFamily ? doc(db, "families", selectedFamily.id, "shopping", selectedList.id, "items", item.id) : null;
    if (!path) return;
    await updateDoc(path, { checked: !item.checked });
  };

  const deleteList = async (list: any) => {
    const path = selectedListType === "personal" 
      ? doc(db, "users", user.uid, "shopping", list.id)
      : selectedFamily ? doc(db, "families", selectedFamily.id, "shopping", list.id) : null;
    if (!path) return;
    await deleteDoc(path);
  };

  const deleteItem = async (item: any) => {
    const path = selectedListType === "personal" 
      ? doc(db, "users", user.uid, "shopping", selectedList.id, "items", item.id)
      : selectedFamily ? doc(db, "families", selectedFamily.id, "shopping", selectedList.id, "items", item.id) : null;
    if (!path) return;
    await deleteDoc(path);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Listes de Courses</Text>
          <View style={{ width: "100%", marginBottom: 15 }}>
        <View style={{
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: "white",
          borderColor: "#00d0ff"
        }}>
          <Picker
            selectedValue={selectedFamily?.id || "personal"}
            onValueChange={(value) => {
              if (value === "personal") {
                setSelectedListType("personal");
                setSelectedFamily(null);
              } else {
                const fam = families.find(f => f.id === value);
                if (fam) {
                  setSelectedFamily(fam);
                  setSelectedListType("family");
                }
              }
            }}
            style={{ width: '100%', backgroundColor: 'white' }}
          >
            <Picker.Item label="Mes listes personnelles" value="personal" />
            <Picker.Item label="── Listes famille ──" value="" enabled={false} />
            {families.map(f => (
              <Picker.Item key={f.id} label={f.name} value={f.id} />
            ))}
          </Picker>
        </View>
      </View>
      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nouvelle liste"
          value={newListName}
          onChangeText={setNewListName}
          onSubmitEditing={createList}
        />
        <TouchableOpacity onPress={createList}>
          <Ionicons name="add-circle" size={40} color="#00d0ff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={shoppingLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <TouchableOpacity onPress={() => openList(item)} style={{ flex: 1 }}>
              <Text style={styles.listText}>{item.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteList(item)}>
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal items */}
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
            <Text style={styles.modalTitle}>{selectedList?.title}</Text>

            <View style={styles.addItemRow}>
              <TextInput
                style={styles.input}
                placeholder="Ajouter un produit"
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={addItem}
              />
              <TouchableOpacity onPress={addItem}>
                <Ionicons name="add-circle" size={40} color="#00d0ff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <TouchableOpacity onPress={() => toggleItem(item)} style={{ flexDirection: "row", flex: 1 }}>
                    <Ionicons name={item.checked ? "checkbox" : "square-outline"} size={28} color="#00d0ff" />
                    <Text style={[styles.itemText, item.checked && { textDecorationLine: "line-through" }]}>
                      {item.name}
                    </Text>
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
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 15,
  },
  addContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#00d0ff",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#f4f4f4",
    borderRadius: 10,
    marginTop: 10,
  },
  listText: {
    fontSize: 18,
  },
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
  
  addItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
 
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 12, paddingVertical: 8 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#00b7ffff",
    borderRadius: 20,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
   itemText: { fontSize: 18, flex: 1 },
    assignedText: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 2,
    fontWeight: "600",
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
});