import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc, } from "firebase/firestore";
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
const [editingItem, setEditingItem] = useState<any>(null);

const [inputValue, setInputValue] = useState('');
 
  

  const user = auth.currentUser;
  if (!user) return;
  
  const deleteList = async (list: any) => {
  await deleteDoc(doc(db, "users", user.uid, "shopping", list.id));
};

const deleteItem = async (item: any) => {
  await deleteDoc(
    doc(db, "users", user.uid, "shopping", selectedList.id, "items", item.id)
  );
};

const startEditList = (list: any) => {
  setEditingItem(list);
  setEditText(list.title);
  setEditModalVisible(true);
};

const saveListEdit = async () => {
  if (!editText.trim()) return;
  await updateDoc(doc(db, "users", user.uid, "shopping", editingItem.id), {
    title: editText,
  });
  setEditModalVisible(false);
  setEditingItem(null);
  setEditText("");
};

const startEditItem = (item: any) => {
  setEditingItem(item);
  setEditText(item.name);
  setEditModalVisible(true);
};

const saveItemEdit = async () => {
  await updateDoc(
    doc(db, "users", user.uid, "shopping", selectedList.id, "items", editingItem.id),
    { name: editText }
  );
  setEditModalVisible(false);
  setEditingItem(null);
  setEditText("");
};



  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "shopping"),
      (snapshot) => {
        const lists: any[] = [];
        snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
        setShoppingLists(lists);
      }
    );
    return unsubscribe;
  }, []);

  //Ajouter la  liste de courses 
  const createList = async () => {
    if (!newListName.trim()) return;
    await addDoc(collection(db, "users", user.uid, "shopping"), {
      title: newListName,
    });
    setNewListName("");
  };

  // Ouvrir une liste et charger les produits
  const openList = (list: any) => {
    setSelectedList(list);
    setModalVisible(true);

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "shopping", list.id, "items"),
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

  // Ajouter un produit
  const addItem = async () => {
    if (!newItem.trim()) return;
    await addDoc(
      collection(db, "users", user.uid, "shopping", selectedList.id, "items"),
      { name: newItem, checked: false }
    );
    setNewItem("");
  };

  // Cocher/Décocher produit 
  const toggleItem = async (item: any) => {
    await updateDoc(
      doc(db, "users", user.uid, "shopping", selectedList.id, "items", item.id),
      { checked: !item.checked }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}> Listes de Courses</Text>

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
            <TouchableOpacity
              onPress={() => toggleItem(item)}
              style={{ flexDirection: "row", flex: 1 }}
            >
              <Ionicons name={item.checked ? "checkbox" : "square-outline"} size={28} color="#00d0ff" />
              <Text style={[styles.itemText, item.checked && { textDecorationLine: "line-through" }]}>
                {item.name}
              </Text>
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
        onSubmitEditing={addItem}
        style={{ borderWidth: 1, borderColor: "#00d0ff", padding: 10, borderRadius: 10 }}
      />

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
});

