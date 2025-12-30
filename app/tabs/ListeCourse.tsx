import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
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
const [editQuantity, setEditQuantity] = useState("");
const [editingItem, setEditingItem] = useState<any>(null);

const [selectedListType, setSelectedListType] = useState("personal");
const [familiesJoined, setFamiliesJoined] = useState<{ id: string; name: string }[]>([]);
const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
const [uid, setUid] = useState<string | null>(null);
const [email, setEmail] = useState<string | null>(null);


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
  setShoppingLists([]);
  setSelectedList(null);
  setItems([]);
}, [selectedListType, selectedFamily]);

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
  
  const deleteList = async (list: any) => {
  if (!uid) return;
  
  let path: any;
  if (selectedListType === "personal") {
    path = doc(db, "users", uid, "shopping", list.id);
  } else {
    if (!selectedFamily || !selectedFamily.id) return;
    path = doc(db, "families", selectedFamily.id, "shopping", list.id);
  }
  
  await deleteDoc(path);
};

const deleteItem = async (item: any) => {
  if (!uid) return;
  
  let path: any;
  if (selectedListType === "personal") {
    path = doc(db, "users", uid, "shopping", selectedList.id, "items", item.id);
  } else {
    if (!selectedFamily || !selectedFamily.id) return;
    path = doc(db, "families", selectedFamily.id, "shopping", selectedList.id, "items", item.id);
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
  if (selectedListType === "personal") {
    path = doc(db, "users", uid, "shopping", editingItem.id);
  } else {
    if (!selectedFamily || !selectedFamily.id) return;
    path = doc(db, "families", selectedFamily.id, "shopping", editingItem.id);
  }
  
  await updateDoc(path, { title: editText });
  setEditModalVisible(false);
  setEditingItem(null);
  setEditText("");
};

const startEditItem = (item: any) => {
  setEditingItem(item);
  setEditText(item.name);
  setEditQuantity(item.quantity || "");
  setEditModalVisible(true);
};

const saveItemEdit = async () => {
  if (!uid) return;
  
  let path: any;
  if (selectedListType === "personal") {
    path = doc(db, "users", uid, "shopping", selectedList.id, "items", editingItem.id);
  } else {
    if (!selectedFamily || !selectedFamily.id) return;
    path = doc(db, "families", selectedFamily.id, "shopping", selectedList.id, "items", editingItem.id);
  }
  
  await updateDoc(path, { name: editText, quantity: editQuantity });
  setEditModalVisible(false);
  setEditingItem(null);
  setEditText("");
  setEditQuantity("");
};



  useEffect(() => {
    if (!uid) return;
    
    let path: any;
    if (selectedListType === "personal") {
      path = collection(db, "users", uid, "shopping");
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = collection(db, "families", selectedFamily.id, "shopping");
    }
    
    const unsubscribe = onSnapshot(path, (snapshot) => {
      const lists: any[] = [];
      snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
      setShoppingLists(lists);
    });
    
    return unsubscribe;
  }, [uid, selectedListType, selectedFamily]);

  //Ajouter la  liste de courses 
  const createList = async () => {
    if (!newListName.trim() || !uid) return;
    
    let path: any;
    if (selectedListType === "personal") {
      path = collection(db, "users", uid, "shopping");
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = collection(db, "families", selectedFamily.id, "shopping");
    }
    
    await addDoc(path, { title: newListName });
    setNewListName("");
  };

  // Ouvrir une liste et charger les produits
  const openList = (list: any) => {
    setSelectedList(list);
    setModalVisible(true);

    let path: any;
    if (selectedListType === "personal") {
      path = collection(db, "users", uid, "shopping", list.id, "items");
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = collection(db, "families", selectedFamily.id, "shopping", list.id, "items");
    }

    const unsubscribe = onSnapshot(path, (snapshot) => {
      const loadedItems: any[] = [];
      snapshot.forEach((doc) =>
        loadedItems.push({ id: doc.id, ...doc.data() })
      );
      setItems(loadedItems);
    });

    return unsubscribe;
  };

  // Ajouter un produit
  const addItem = async () => {
    if (!newItem.trim() || !uid) return;
    
    let path: any;
    if (selectedListType === "personal") {
      path = collection(db, "users", uid, "shopping", selectedList.id, "items");
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = collection(db, "families", selectedFamily.id, "shopping", selectedList.id, "items");
    }
    
    await addDoc(path, { name: newItem, quantity: newQuantity, checked: false });
    setNewItem("");
  };

  // Cocher/Décocher produit 
  const toggleItem = async (item: any) => {
    if (!uid) return;
    
    let path: any;
    if (selectedListType === "personal") {
      path = doc(db, "users", uid, "shopping", selectedList.id, "items", item.id);
    } else {
      if (!selectedFamily || !selectedFamily.id) return;
      path = doc(db, "families", selectedFamily.id, "shopping", selectedList.id, "items", item.id);
    }
    
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
      <Text style={styles.title}> Listes de Courses</Text>

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
                const fam = familiesJoined.find(f => f.id === value);
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
            {familiesJoined.map(f => (
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

      <View style={styles.addItemRow}>
        <TextInput
          style={[styles.input, { flex: 2 }]}
          placeholder="Ajouter un produit"
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={addItem}
        />
        <TextInput
          style={[styles.input, { flex: 1, marginLeft: 8 }]}
          placeholder="Qté (ex: 3L)"
          value={newQuantity}
          onChangeText={setNewQuantity}
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
            <TouchableOpacity
              onPress={() => toggleItem(item)}
              style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
            >
              <Ionicons name={item.checked ? "checkbox" : "square-outline"} size={28} color="#00d0ff" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.itemText, item.checked && { textDecorationLine: "line-through" }]}>
                  {item.name}
                </Text>
                {item.quantity && (
                  <Text style={[styles.quantityText, item.checked && { textDecorationLine: "line-through" }]}>
                    Quantité: {item.quantity}
                  </Text>
                )}
              </View>
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
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor:"rgba(0,0,0,0.5)" }}>
    <View style={{ backgroundColor: "white", padding: 20, borderRadius: 15, width: "80%" }}>
      
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>Modifier</Text>

      <TextInput
        value={editText}
        onChangeText={setEditText}
        placeholder="Nom"
        style={{ borderWidth: 1, borderColor: "#00d0ff", padding: 10, borderRadius: 10, marginBottom: 10 }}
      />

      {editingItem?.name && (
        <TextInput
          value={editQuantity}
          onChangeText={setEditQuantity}
          placeholder="Quantité (ex: 3L, 500g, 2)"
          style={{ borderWidth: 1, borderColor: "#00d0ff", padding: 10, borderRadius: 10 }}
        />
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 20 }}>
        <TouchableOpacity onPress={() => setEditModalVisible(false)}>
          <Text style={{ fontSize: 15, color: "red" }}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={editingItem?.name ? saveItemEdit : saveListEdit}>
          <Text style={{ fontSize: 15, color: "green" }}>Sauvegarder</Text>
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
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 15 },
  addContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
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
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
  addItemRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  itemText: { fontSize: 18, marginLeft: 10 },
  quantityText: { fontSize: 14, color: "#666", marginLeft: 10, marginTop: 2 },
});
