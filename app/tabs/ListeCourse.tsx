import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
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
          if (typeof memberItem === "string" && memberItem === user.email) {
            return true; // Format ancien
          } else if (typeof memberItem === "object" && memberItem.email === user.email) {
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
    let path =
      selectedListType === "personal"
        ? collection(db, "users", user.uid, "shopping")
        : selectedFamily
        ? collection(db, "families", selectedFamily.id, "shopping")
        : null;

    if (!path) return;

    const unsubscribe = onSnapshot(path, (snapshot) => {
      const lists: any[] = [];
      snapshot.forEach((doc) => lists.push({ id: doc.id, ...doc.data() }));
      setShoppingLists(lists);
    });
    return unsubscribe;
  }, [selectedListType, selectedFamily]);

  const createList = async () => {
    if (!newListName.trim()) return;
    const path =
      selectedListType === "personal"
        ? collection(db, "users", user.uid, "shopping")
        : selectedFamily
        ? collection(db, "families", selectedFamily.id, "shopping")
        : null;

    if (!path) return;

    await addDoc(path, { title: newListName });
    setNewListName("");
  };

  const openList = (list: any) => {
    setSelectedList(list);
    setModalVisible(true);

    const path =
      selectedListType === "personal"
        ? collection(db, "users", user.uid, "shopping", list.id, "items")
        : selectedFamily
        ? collection(db, "families", selectedFamily.id, "shopping", list.id, "items")
        : null;

    if (!path) return;

    const unsubscribe = onSnapshot(path, (snapshot) => {
      const loadedItems: any[] = [];
      snapshot.forEach((doc) => loadedItems.push({ id: doc.id, ...doc.data() }));
      setItems(loadedItems);
    });
    return unsubscribe;
  };

  const addItem = async () => {
    if (!newItem.trim() || !selectedList) return;
    const path =
      selectedListType === "personal"
        ? collection(db, "users", user.uid, "shopping", selectedList.id, "items")
        : selectedFamily
        ? collection(db, "families", selectedFamily.id, "shopping", selectedList.id, "items")
        : null;
    if (!path) return;
    await addDoc(path, { name: newItem, checked: false });
    setNewItem("");
  };

  const toggleItem = async (item: any) => {
    const path =
      selectedListType === "personal"
        ? doc(db, "users", user.uid, "shopping", selectedList.id, "items", item.id)
        : selectedFamily
        ? doc(db, "families", selectedFamily.id, "shopping", selectedList.id, "items", item.id)
        : null;
    if (!path) return;
    await updateDoc(path, { checked: !item.checked });
  };

  const deleteList = async (list: any) => {
    const path =
      selectedListType === "personal"
        ? doc(db, "users", user.uid, "shopping", list.id)
        : selectedFamily
        ? doc(db, "families", selectedFamily.id, "shopping", list.id)
        : null;
    if (!path) return;
    await deleteDoc(path);
  };

  const deleteItem = async (item: any) => {
    const path =
      selectedListType === "personal"
        ? doc(db, "users", user.uid, "shopping", selectedList.id, "items", item.id)
        : selectedFamily
        ? doc(db, "families", selectedFamily.id, "shopping", selectedList.id, "items", item.id)
        : null;
    if (!path) return;
    await deleteDoc(path);
  };

  return (
  <View className="flex-1 bg-[#FAFBFC]">
    {/* Header */}
    <View 
      className="px-5 pt-16 pb-5 bg-white"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Text className="text-[28px] font-bold text-[#111827] mb-4">Listes de Courses</Text>

      {/* Sélecteur Personnel/Famille */}
      <View className="w-full">
        <Text className="text-[12px] font-semibold text-[#9CA3AF] mb-2 uppercase tracking-wide">
          Type de liste
        </Text>
        <View 
          className="border-2 rounded-2xl px-4 py-1 bg-white overflow-hidden"
          style={{ borderColor: '#60AFDF' }}
        >
          <Picker
            selectedValue={selectedFamily?.id || "personal"}
            onValueChange={(value) => {
              if (value === "personal") {
                setSelectedListType("personal");
                setSelectedFamily(null);
              } else {
                const fam = families.find((f) => f.id === value);
                if (fam) {
                  setSelectedFamily(fam);
                  setSelectedListType("family");
                }
              }
            }}
            style={{ width: "100%", backgroundColor: "white" }}
          >
            <Picker.Item label="👤 Mes listes personnelles" value="personal" />
            <Picker.Item label="──────────" value="" enabled={false} />
            {families.map((f) => (
              <Picker.Item key={f.id} label={`👨‍👩‍👧‍👦 ${f.name}`} value={f.id} />
            ))}
          </Picker>
        </View>
      </View>
    </View>

    <View className="flex-1 px-5 pt-5">
      {/* Créer une nouvelle liste */}
      <View className="flex-row items-center mb-5 gap-3">
        <TextInput
          className="flex-1 border border-[#E5E7EB] px-4 py-4 rounded-2xl bg-white text-[16px] text-[#111827]"
          placeholder="Nouvelle liste de courses"
          placeholderTextColor="#9CA3AF"
          value={newListName}
          onChangeText={setNewListName}
          onSubmitEditing={createList}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        />
        <TouchableOpacity 
          onPress={createList}
          className="w-10 h-10 rounded-3xl items-center justify-center"
          style={{backgroundColor: newListName.trim()
              ? '#FF914D'       
              : '#F8D8C0'       
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Liste des listes de courses */}
      {shoppingLists.length === 0 ? (
        <View 
          className="bg-white rounded-3xl p-8 items-center mt-8"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="w-16 h-16 rounded-full bg-[#EBF5FF] items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={32} color="#60AFDF" />
          </View>
          <Text className="text-[18px] font-bold text-[#111827] mb-2">
            Aucune liste
          </Text>
          <Text className="text-[14px] text-[#9CA3AF] text-center">
            Créez votre première liste de courses
          </Text>
        </View>
      ) : (
        <FlatList
          data={shoppingLists}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => openList(item)}
              className="bg-white rounded-3xl p-5 mb-4 flex-row items-center justify-between"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-[#EBF5FF] items-center justify-center mr-4">
                  <Ionicons name="cart" size={24} color="#60AFDF" />
                </View>
                <View className="flex-1">
                  <Text className="text-[18px] font-bold text-[#111827]">
                    {item.title}
                  </Text>
                  <Text className="text-[13px] text-[#9CA3AF] mt-1">
                    Appuyez pour voir les articles
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (confirm(`Supprimer la liste "${item.title}" ?`)) {
                      deleteList(item);
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-[#FEF2F2] items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#F64040" />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>

    {/* Modal items */}
    <Modal visible={modalVisible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-center items-center">
        <View className="bg-white rounded-3xl w-[90%] max-h-[85%]">
          {/* Header du modal */}
          <View className="flex-row items-center justify-between p-6 border-b border-[#F1F3F5]">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-2xl bg-[#EBF5FF] items-center justify-center mr-3">
                <Ionicons name="cart" size={20} color="#60AFDF" />
              </View>
              <Text className="text-[22px] font-bold text-[#111827] flex-1" numberOfLines={1}>
                {selectedList?.title}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              className="w-10 h-10 rounded-full bg-[#F8F9FA] items-center justify-center ml-2"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Contenu du modal */}
          <View className="p-6">
            {/* Ajouter un article */}
            <View className="flex-row items-center mb-5 gap-3">
              <TextInput
                className="flex-1 border border-[#E5E7EB] px-4 py-3.5 rounded-2xl bg-white text-[16px] text-[#111827]"
                placeholder="Ajouter un article"
                placeholderTextColor="#9CA3AF"
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={addItem}
              />
              <TouchableOpacity 
                onPress={addItem}
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{
                backgroundColor: newItem.trim()
                  ? '#FF914D'
                  : '#F8D8C0'
                  }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={26} color="white" />
              </TouchableOpacity>
            </View>

            {/* Liste des articles */}
            {items.length === 0 ? (
              <View className="py-12 items-center">
                <View className="w-14 h-14 rounded-full bg-[#F8F9FA] items-center justify-center mb-3">
                  <Ionicons name="basket-outline" size={28} color="#9CA3AF" />
                </View>
                <Text className="text-[15px] font-semibold text-[#6B7280]">
                  Liste vide
                </Text>
                <Text className="text-[13px] text-[#9CA3AF] text-center mt-1">
                  Ajoutez vos premiers articles
                </Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(i) => i.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <View 
                    className="flex-row items-center py-3 px-4 mb-2 rounded-2xl"
                    style={{ 
                      backgroundColor: item.checked ? '#F0F9ED' : '#FAFBFC'
                    }}
                  >
                    <TouchableOpacity 
                      onPress={() => toggleItem(item)} 
                      className="flex-row flex-1 items-center"
                      activeOpacity={0.7}
                    >
                      <View 
                        className="w-7 h-7 rounded-lg items-center justify-center mr-3"
                        style={{ 
                          backgroundColor: item.checked ? '#ABF085' : 'white',
                          borderWidth: item.checked ? 0 : 2,
                          borderColor: '#E5E7EB'
                        }}
                      >
                        {item.checked && (
                          <Ionicons name="checkmark" size={18} color="white" />
                        )}
                      </View>
                      
                      <Text 
                        className="text-[16px] flex-1"
                        style={[
                          { color: item.checked ? '#7CB368' : '#111827' },
                          item.checked && { textDecorationLine: "line-through" }
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => {
                        if (confirm(`Supprimer "${item.name}" ?`)) {
                          deleteItem(item);
                        }
                      }}
                      className="w-9 h-9 rounded-xl bg-[#FEF2F2] items-center justify-center ml-2"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F64040" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            {/* Footer avec stats */}
            {items.length > 0 && (
              <View 
                className="mt-4 pt-4 border-t border-[#F1F3F5] flex-row justify-between"
              >
                <View>
                  <Text className="text-[12px] text-[#9CA3AF] mb-1">Articles cochés</Text>
                  <Text className="text-[16px] font-bold text-[#111827]">
                    {items.filter(i => i.checked).length} / {items.length}
                  </Text>
                </View>
                {items.filter(i => i.checked).length === items.length && (
                  <View className="flex-row items-center bg-[#F0F9ED] px-4 py-2 rounded-full">
                    <Ionicons name="checkmark-circle" size={18} color="#ABF085" />
                    <Text className="text-[13px] font-semibold text-[#7CB368] ml-2">
                      Terminé !
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  </View>
);
}