import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import mascotte_moneyy from "assets/images/mascotte_moneyy.png";
import { Image } from "expo-image";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export function Budget() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<"personal" | "family">("personal");
  const [familiesJoined, setFamiliesJoined] = useState<{ id: string; name: string }[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<{ id: string; name: string } | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Modal pour créer un nouveau budget
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [budgetName, setBudgetName] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");

  // Modal pour voir les dépenses d'un budget
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [expensesModalVisible, setExpensesModalVisible] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Ajouter une dépense
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

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

    // Charger TOUTES les familles et filtrer côté client (pour supporter les deux formats)
    const q = query(collection(db, "families"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFamilies: any[] = [];
      snapshot.forEach((doc) => allFamilies.push({ id: doc.id, ...doc.data() }));

      // Filtrer pour ne garder que les familles où l'utilisateur est membre
      const userFamilies = allFamilies.filter((family: any) => {
        const members = family.members || [];

        for (const memberItem of members) {
          if (typeof memberItem === "string" && memberItem === email) {
            return true; // Format ancien
          } else if (typeof memberItem === "object" && memberItem.email === email) {
            return true; // Format nouveau
          }
        }
        return false;
      });

      setFamiliesJoined(userFamilies);
    });

    return () => unsubscribe();
  }, [email]);

  // Charger les budgets
  useEffect(() => {
    if (!uid) return;

    let unsubscribe: any;

    if (selectedType === "personal") {
      const budgetsCollection = collection(db, "users", uid, "budgets");
      unsubscribe = onSnapshot(budgetsCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setBudgets(list);
      });
    } else if (selectedType === "family" && selectedFamily) {
      const budgetsCollection = collection(db, "families", selectedFamily.id, "budgets");
      unsubscribe = onSnapshot(budgetsCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setBudgets(list);
      });
    }

    return () => unsubscribe && unsubscribe();
  }, [uid, selectedType, selectedFamily]);

  // Charger les dépenses du budget sélectionné
  useEffect(() => {
    if (!selectedBudget || !uid) return;

    let unsubscribe: any;

    if (selectedType === "personal") {
      const expensesCollection = collection(db, "users", uid, "budgets", selectedBudget.id, "expenses");
      unsubscribe = onSnapshot(expensesCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        // Trier par date (plus récent en premier)
        list.sort((a, b) => {
          const dateA = a.date.split("/").reverse().join("");
          const dateB = b.date.split("/").reverse().join("");
          return dateB.localeCompare(dateA);
        });
        setExpenses(list);
      });
    } else if (selectedType === "family" && selectedFamily) {
      const expensesCollection = collection(db, "families", selectedFamily.id, "budgets", selectedBudget.id, "expenses");
      unsubscribe = onSnapshot(expensesCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => {
          const dateA = a.date.split("/").reverse().join("");
          const dateB = b.date.split("/").reverse().join("");
          return dateB.localeCompare(dateA);
        });
        setExpenses(list);
      });
    }

    return () => unsubscribe && unsubscribe();
  }, [selectedBudget, uid, selectedType, selectedFamily]);

  // Créer un nouveau budget
  const createBudget = async () => {
    if (!budgetName.trim() || !budgetLimit.trim() || !uid) return;

    const limit = parseFloat(budgetLimit);
    if (isNaN(limit) || limit <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    try {
      const budgetData = {
        name: budgetName,
        limit: limit,
        createdAt: new Date().toISOString(),
      };

      if (selectedType === "personal") {
        await addDoc(collection(db, "users", uid, "budgets"), budgetData);
      } else if (selectedFamily) {
        await addDoc(collection(db, "families", selectedFamily.id, "budgets"), budgetData);
      }

      setBudgetName("");
      setBudgetLimit("");
      setCreateModalVisible(false);
    } catch (error) {
      console.error("Erreur lors de la création du budget:", error);
      alert("Erreur lors de la création du budget");
    }
  };

  // Ajouter une dépense
  const addExpense = async () => {
    if (!expenseName.trim() || !expenseAmount.trim() || !selectedBudget || !uid) return;

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    try {
      const expenseData = {
        name: expenseName,
        amount: amount,
        description: expenseDescription || "",
        date: expenseDate,
        createdAt: new Date().toISOString(),
      };

      if (selectedType === "personal") {
        await addDoc(collection(db, "users", uid, "budgets", selectedBudget.id, "expenses"), expenseData);
      } else if (selectedFamily) {
        await addDoc(collection(db, "families", selectedFamily.id, "budgets", selectedBudget.id, "expenses"), expenseData);
      }

      setExpenseName("");
      setExpenseAmount("");
      setExpenseDescription("");
      // Réinitialiser à la date du jour
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      setExpenseDate(`${dd}/${mm}/${yyyy}`);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la dépense:", error);
      alert("Erreur lors de l'ajout de la dépense");
    }
  };

  // Supprimer un budget
  const deleteBudget = async (budgetId: string) => {
    if (!uid) return;

    try {
      if (selectedType === "personal") {
        await deleteDoc(doc(db, "users", uid, "budgets", budgetId));
      } else if (selectedFamily) {
        await deleteDoc(doc(db, "families", selectedFamily.id, "budgets", budgetId));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du budget:", error);
    }
  };

  // Supprimer une dépense
  const deleteExpense = async (expenseId: string) => {
    if (!uid || !selectedBudget) return;

    try {
      if (selectedType === "personal") {
        await deleteDoc(doc(db, "users", uid, "budgets", selectedBudget.id, "expenses", expenseId));
      } else if (selectedFamily) {
        await deleteDoc(doc(db, "families", selectedFamily.id, "budgets", selectedBudget.id, "expenses", expenseId));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la dépense:", error);
    }
  };

  // Calculer le total des dépenses
  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  };

  // Calculer le pourcentage utilisé
  const getPercentage = (budget: any) => {
    if (!budget.limit) return 0;
    const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    return Math.min((total / budget.limit) * 100, 100);
  };





return (
  <View className="flex-1 bg-[#FAFBFC]">
    {/* Header avec sélecteur de type de bidget*/}
    <View 
      className="bg-white px-5 pt-4 pb-5"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Text className="text-[13px] font-semibold mb-3 tracking-wide"
      style={{ fontFamily: 'Montserrat_400Regular', color: "#6DDB31", fontSize: 20 }}>
        Type de budget
      </Text>
      
      <View 
        className="rounded-xl overflow-hidden bg-white border item-center px-3 py-0.5"
        style={{ borderColor: '#FF8C42' }}
      >
        <Picker
          selectedValue={selectedFamily?.id || "personal"}
          onValueChange={(value) => {
            if (value === "personal") {
              setSelectedType("personal");
              setSelectedFamily(null);
            } else {
              const fam = familiesJoined.find((f) => f.id === value);
              if (fam) {
                setSelectedFamily(fam);
                setSelectedType("family");
              }
            }
          }}
          className="p-1"
          style={{
            width: "100%",
            backgroundColor: "white",
            fontFamily: 'Montserrat_400Regular',
            fontSize: 14,
          }}
        >
          <Picker.Item label="👤 Personnel" value="personal" />
          <Picker.Item label="──────────" value="" enabled={false} />
          {familiesJoined.map((f) => (
            <Picker.Item key={f.id} label={`👨‍👩‍👧‍👦 ${f.name}`} value={f.id} />
          ))}
        </Picker>
      
    </View>

      {/* Bouton créer budget - AFFICHÉ SEULEMENT SI IL Y A DES BUDGETS */}
{budgets.length > 0 && (
  <View className="px-5 pt-4 pb-2">
    <TouchableOpacity
      className="flex-row items-center justify-center py-3.5 px-6 rounded-2xl"
      style={{ 
        backgroundColor: '#FF914D',
        shadowColor: "#FF914D",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
      }}
      onPress={() => setCreateModalVisible(true)}
      activeOpacity={0.85}
    >
      <Ionicons name="add-circle" size={22} color="white" />
      <Text className="text-white text-[15px] font-bold ml-2 tracking-wide"
      style={{ fontFamily: 'Montserrat_400Regular' }}>
        Nouveau budget
      </Text>
    </TouchableOpacity>
  </View>
)}
</View>
{/* Liste des budgets avec ScrollView  */}
<ScrollView 
  className="flex-1 px-5" 
  contentContainerStyle={{ paddingBottom: 24 }}
  showsVerticalScrollIndicator={false}
>
  {budgets.length === 0 ? (
    /* État vide  */
    <View 
      className="items-center justify-center mt-12 bg-white rounded-3xl p-8"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Mascotte */}
          <View className="flex-1 justify-center px-6 mb-6">
            <Image
              source={mascotte_moneyy}
              className="w-36 h-36 self-center"
              contentFit="contain"
            />
          </View>

          <Text className="text-[22px] text-[#111827] font-bold mb-2"
          style={{ fontFamily: 'Montserrat_400Regular', color: "#FF8C42" }}>
            Commencez à budgétiser
          </Text>
          <Text className="text-[15px] text-[#6B7280] text-center px-4 mb-6 leading-5"
          style={{ fontFamily: 'Montserrat_400Regular' }}>
            Gérez vos dépenses{'\n'}pour atteindre vos objectifs financiers
          </Text>
      
      {/* CTA primaire */}
      <TouchableOpacity
        className="px-8 py-3 bg-[#FF914D] rounded-2xl flex-row items-center mb-2"
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.8}
        style={{
          shadowColor: "#FF8C42",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Ionicons name="add-circle" size={25} color="white" />
        <Text className="text-white font-bold ml-2 text-[16px]"
        style={{ fontFamily: 'Montserrat_400Regular' }}>
          Créer mon premier budget
        </Text>
      </TouchableOpacity>
      
    </View>
  ) : (
    /* Liste des budgets - plus simple  */
    <>
      {/* Header de section simple */}
      <View className="mb-4 mt-3">
        <Text className="text-[15px] font-semibold text-[#9CA3AF] tracking-wide"
        style={{ fontFamily: 'Montserrat_400Regular', color:"#000" }}>
          Mes budgets
        </Text>
        <Text className="text-[13px] text-[#6B7280] mt-0.5"
        style={{ fontFamily: 'Montserrat_400Regular' }}>
          {budgets.length} budget{budgets.length > 1 ? 's' : ''} actif{budgets.length > 1 ? 's' : ''}
        </Text>
      </View>

      {budgets.map((budget) => {
        return (
          <TouchableOpacity
            key={budget.id}
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
            onPress={() => {
              setSelectedBudget(budget);
              setExpensesModalVisible(true);
            }}
            activeOpacity={0.7}
          >
  
           {/* Header de la card */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 pr-3">
                    {/* Titre avec icône catégorie */}
                    <View className="flex-row items-center mb-3">
                      <View className="w-12 h-12 rounded-2xl bg-[#FFF4ED] items-center justify-center mr-3">
                        <Ionicons name="wallet" size={24} color="#FF8C42" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[20px] font-bold text-[#111827] mb-1"
                        style={{ fontFamily: 'Montserrat_400Regular', color:"#FF8C42" }}>
                          {budget.name}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="card-outline" size={14} color="#9CA3AF" />
                          <Text className="text-[14px] text-[#6B7280] ml-1.5 font-medium"
                          style={{ fontFamily: 'Montserrat_400Regular' }}>
                            Budget : {budget.limit.toFixed(2)}€
                          </Text>
                        </View>
                      </View>
                    </View>

                {/* Action rapide : Ajouter une dépense - ouais cbon*/}
                <TouchableOpacity
                  className="flex-row items-center justify-center py-3  rounded-xl"
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedBudget(budget);
                    setExpensesModalVisible(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="#6DDB31" />
                  <Text className="text-[14px] font-semibold text-[#60AFDF] ml-2"
                  style={{ fontFamily: 'Montserrat_400Regular', color:"#6DDB31" }}>
                    Ajouter une dépense
                  </Text>
                </TouchableOpacity>
              </View>

               {/* Actions à droite */}
                  <View className="items-center gap-3">
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer le budget "${budget.name}" ?`)) {
                          deleteBudget(budget.id);
                        }
                      }}
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      activeOpacity={0.7}
                    >
                    <Ionicons name="chevron-forward" size={24} color="#000" />

                    </TouchableOpacity>
                      <Ionicons name="trash-outline" size={18} color="#F64040" />

                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

      {/* CTA pour ajouter un autre budget -> parfait -rien à chnager*/}
      <TouchableOpacity
        className="bg-[#F8F9FA] rounded-2xl p-4 flex-row items-center justify-center border-2 border-dashed border-[#E5E7EB] mt-2"
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={22} color="#9CA3AF" />
        <Text className="text-[15px] font-semibold text-[#6B7280] ml-2"
        style={{ fontFamily: 'Montserrat_400Regular' }}>
          Ajouter un budget
        </Text>
      </TouchableOpacity>
    </>
  )}
</ScrollView>
    
       

{/* Modal pr création Budget  */}
    <Modal
      visible={createModalVisible}
      transparent
      animationType="slide"
      onRequestClose={(e) => {e.stopPropagation();return setCreateModalVisible(false);}}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-5">
        <View 
          className="bg-white rounded-3xl px-6 py-6 w-full max-w-[520px]"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {/* Bouton fermer */}
          <TouchableOpacity
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#F8F9FA] items-center justify-center"
            onPress={() => setCreateModalVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-14 h-14 rounded-full bg-[#FFF4ED] items-center justify-center mb-3">
              <Ionicons name="wallet" size={28} color="#FF914D" />
            </View>
            <Text className="text-[24px] font-bold text-[#111827] mb-1"
            style={{ fontFamily: 'Shrikhand_400Regular', fontWeight: "400", color: "#FF8C42" }}>
              Nouveau budget
            </Text>
            <Text className="text-[14px] text-[#6B7280]"
            style={{fontFamily: 'Montserrat_400Regular'}}>
              Définissez votre budget
            </Text>
          </View>

          {/* Badge type de budget */}
          <View
            className="py-3 px-4 rounded-2xl mb-6"
            style={{
              backgroundColor: selectedType === "personal" ? "#EBF5FF" : "#F0F9ED",
            }}
          >
            <Text
              className="text-center font-semibold text-[15px]"
              style={{
                color: selectedType === "personal" ? "#60AFDF" : "#6DDB31",
              }}
            >
              {selectedType === "personal" ? "👤 Personnel" : `👨‍👩‍👧‍👦 ${selectedFamily?.name}`}
            </Text>
          </View>

          {/* Formulaire */}
          <View className="mb-2">
            <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 ml-1 tracking-wide"
            style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
              Nom du budget
            </Text>
            <TextInput
              className="border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] bg-white text-[#111827]"
              placeholder="Ex: Cadeaux, Courses, Loisirs..."
              placeholderTextColor="#9CA3AF"
              value={budgetName}
              selectionColor="#f2a167"
              onChangeText={setBudgetName}
              maxLength={50}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
          </View>

          <View className="mb-6">
            <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 ml-1 tracking-wide"
            style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
              Montant limite
            </Text>
            <View className="relative">
              <TextInput
                className="border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] bg-white text-[#111827] pr-12"
                placeholder="300"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={budgetLimit}
                onChangeText={setBudgetLimit}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
              <View className="absolute right-4 top-4">
                <Text className="text-[16px] font-bold text-[#9CA3AF]">€</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
            <TouchableOpacity
            className="w-full py-4 rounded-3xl items-center justify-center flex-row mt-2"
            onPress={createBudget}
            disabled={!budgetName.trim() || !budgetLimit.trim()}
            activeOpacity={0.85}
            style={{
              backgroundColor: (!budgetName.trim() || !budgetLimit.trim()) 
                ? "#E5E7EB"  // Gris quand désactivé
                : "#FF8C42",  // ✅ Orange Daily Nest quand actif
              shadowColor: (!budgetName.trim() || !budgetLimit.trim()) 
                ? "transparent" 
                : "#FF8C42",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: (!budgetName.trim() || !budgetLimit.trim()) ? 0 : 0.35,
              shadowRadius: 7,
              elevation: (!budgetName.trim() || !budgetLimit.trim()) ? 0 : 5,
              
            }}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={22} 
              color={(!budgetName.trim() || !budgetLimit.trim()) ? "#9CA3AF" : "white"}
              style={{ marginRight: 8 }}
            />
            <Text
              className="text-[16px] font-bold"
              style={{
                fontFamily: 'Montserrat_400Regular', color: (!budgetName.trim() || !budgetLimit.trim()) ? "#9CA3AF" : "#FFFFFF",
              }}
            >
              Créer le budget
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
 






      {/* Modal pour voir/ajouter des dépenses - et parfaite omg */}
<Modal
  visible={expensesModalVisible}
  transparent
  animationType="slide"
  onRequestClose={(e) => {
    e.stopPropagation();
    setExpensesModalVisible(false);
    setSelectedBudget(null);
  }}
>
  <View className="flex-1 bg-black/60">
    {/* Container principal avec padding pour safe area */}
    <View className="flex-1 justify-end">
      <View 
        className="bg-white w-full max-h-[92%]"
        style={{
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
        }}
      >
        {/* Header */}
        <View 
          className="px-6 pt-6 pb-4 border-b border-[#F1F3F5]"
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            backgroundColor: 'white',
          }}
        >
          {/* Drag indicator */}
          <View className="w-12 h-1.5 bg-[#E5E7EB] rounded-full self-center mb-4" />
          
          <TouchableOpacity
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-[#F8F9FA] items-center justify-center"
            onPress={() => {
              setExpensesModalVisible(false);
              setSelectedBudget(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>

          {selectedBudget && (
            <>
              <Text className="text-[28px] font-bold text-[#111827] mb-1 pr-12"
              style={{fontFamily: 'Montserrat_400Regular', color:"#FF8C42"}}>
                {selectedBudget.name}
              </Text>
              <Text className="text-[15px] text-[#6B7280]"
              style={{fontFamily: 'Montserrat_400Regular'}}>
                Budget • {selectedBudget.limit.toFixed(2)}€
              </Text>
            </>
          )}
        </View>

        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {selectedBudget && (
            <View className="px-6">
              {/* Card indicateur de budget  */}
              <View 
                className="mt-6 mb-6 p-6 rounded-3xl"
                style={{
                  backgroundColor: getTotalExpenses() > selectedBudget.limit ? '#FEF2F2' : '#F0F9ED',
                }}
              >
                {/* Stats principales */}
                <View className="flex-row justify-between items-start mb-5">
                  <View className="flex-1">
                    <Text className="text-[13px] font-medium text-[#6B7280] mb-1"
                    style={{fontFamily: 'Montserrat_400Regular'}}>
                      Dépensé
                    </Text>
                    <Text 
                      className="text-[32px] font-bold"
                      style={{
                        color: getTotalExpenses() > selectedBudget.limit ? '#F64040' : '#111827'
                      }}
                    >
                      {getTotalExpenses().toFixed(2)}€
                    </Text>
                  </View>

                  <View 
                    className="px-4 py-2.5 rounded-2xl"
                    style={{
                      backgroundColor: getTotalExpenses() > selectedBudget.limit ? '#FEE2E2' : '#DCFCE7'
                    }}
                  >
                    <Text 
                      className="text-[13px] font-semibold"
                      style={{
                        color: getTotalExpenses() > selectedBudget.limit ? '#F64040' : '#7CB368'
                      }}
                    >
                      {((getTotalExpenses() / selectedBudget.limit) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                {/* barre de progression */}
                <View className="mb-4">
                  <View 
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((getTotalExpenses() / selectedBudget.limit) * 100, 100)}%`,
                        backgroundColor: getTotalExpenses() > selectedBudget.limit ? '#F64040' : 
                                        getTotalExpenses() / selectedBudget.limit >= 0.8 ? '#FF914D' : 
                                        '#ABF085',
                      }}
                    />
                  </View>
                </View>

                {/* Info restant/dépassement */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={selectedBudget.limit - getTotalExpenses() >= 0 ? "checkmark-circle" : "alert-circle"}
                      size={20} 
                      color={selectedBudget.limit - getTotalExpenses() >= 0 ? "#7CB368" : "#F64040"}
                    />
                    <Text 
                      className="text-[15px] font-semibold ml-2"
                      style={{
                        color: selectedBudget.limit - getTotalExpenses() >= 0 ? '#7CB368' : '#F64040'
                      }}
                    >
                      {selectedBudget.limit - getTotalExpenses() >= 0 ? 'Restant' : 'Dépassement'}
                    </Text>
                  </View>
                  <Text 
                    className="text-[18px] font-bold"
                    style={{
                      color: selectedBudget.limit - getTotalExpenses() >= 0 ? '#7CB368' : '#F64040'
                    }}
                  >
                    {Math.abs(selectedBudget.limit - getTotalExpenses()).toFixed(2)}€
                  </Text>
                </View>
              </View>

              {/* Section "Ajouter une dépense" - Design card floating */}
              <View 
                className="mb-6 p-5 rounded-3xl border border-[#FFE8D6]"
                style={{
                  backgroundColor: '#FFFBF7',
                }}
              >
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-full bg-[#FF914D]/10 items-center justify-center mr-3">
                    <Ionicons name="add-circle" size={22} color="#FF914D" />
                  </View>
                  <Text className="text-[20px] font-bold text-[#111827]"
                  style={{fontFamily: 'Montserrat_400Regular', color:"#FF8C42"}}>
                    Nouvelle dépense
                  </Text>
                </View>

                {/* Inputs avec labels flottants style */}
                <View className="mb-3">
                  <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 ml-1"
                  style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
                    Nom
                  </Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] text-[#111827]"
                    placeholder="Ex: Restaurant, Essence..."
                    placeholderTextColor="#9CA3AF"
                    value={expenseName}
                    onChangeText={setExpenseName}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  />
                </View>

                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 ml-1"
                    style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
                      Montant
                    </Text>
                    <View className="relative">
                      <TextInput
                        className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] text-[#111827] pr-10"
                        placeholder="0.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={expenseAmount}
                        onChangeText={setExpenseAmount}
                        style={{
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      />
                      <Text className="absolute right-4 top-4 text-[16px] font-semibold text-[#9CA3AF]">
                        €
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 ml-1"
                    style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
                      Date
                    </Text>
                    <View 
                      className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      <input
                        type="date"
                    value={expenseDate ? (() => {
                      const parts = expenseDate.split('/');
                      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                    })() : ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (!e.target.value) return; // ignore empty
                          const dateParts = e.target.value.split("-");
                          if (dateParts.length === 3) {
                            setExpenseDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                          }
                        }}
                        style={{ 
                          width: "100%", 
                          border: "none", 
                          outline: "none", 
                          background: "transparent", 
                          fontSize: 16, 
                          color: "#111827",
                          fontFamily: 'inherit'
                        }}
                      />
                    </View>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-[12px] font-semibold text-[#6B7280] mb-2 ml-1"
                  style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
                    Description (optionnel)
                  </Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-[16px] text-[#111827]"
                    placeholder="Ajouter une note..."
                    placeholderTextColor="#9CA3AF"
                    value={expenseDescription}
                    onChangeText={setExpenseDescription}
                    multiline
                    numberOfLines={3}
                    style={{ 
                      minHeight: 90, 
                      textAlignVertical: "top",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  />
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  className={`rounded-2xl py-4 flex-row items-center justify-center ${
                    (!expenseName.trim() || !expenseAmount.trim()) ? "bg-[#E5E7EB]" : "bg-[#FF914D]"
                  }`}
                  onPress={addExpense}
                  disabled={!expenseName.trim() || !expenseAmount.trim()}
                  activeOpacity={0.8}
                  style={{
                    shadowColor: (!expenseName.trim() || !expenseAmount.trim()) ? "transparent" : "#FF8C42",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: (!expenseName.trim() || !expenseAmount.trim()) ? 0 : 4,
                  }}
                >
                  <Ionicons
                    name="add-circle"
                    size={22}
                    color={(!expenseName.trim() || !expenseAmount.trim()) ? "#9CA3AF" : "white"}
                  />
                  <Text
                    className={`ml-2 text-[16px] font-bold ${
                      (!expenseName.trim() || !expenseAmount.trim()) ? "text-[#9CA3AF]" : "text-white"
                    }`}
                    style={{fontFamily: 'Montserrat_400Regular'}}
                  >
                    Ajouter la dépense
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Liste des dépenses  */}
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-[20px] font-bold text-[#111827]"
                  style={{fontFamily: 'Montserrat_400Regular', color:"#FF8C42"}}>
                    Historique
                  </Text>
                  {expenses.length > 0 && (
                    <View className="bg-[#F3F4F6] px-3 py-1.5 rounded-full">
                      <Text className="text-[13px] font-semibold text-[#6B7280]">
                        {expenses.length} {expenses.length === 1 ? 'dépense' : 'dépenses'}
                      </Text>
                    </View>
                  )}
                </View>

                {expenses.length === 0 ? (
                  <View className="py-12 items-center">
                    <View 
                      className="w-16 h-16 rounded-full items-center justify-center mb-4"
                      style={{ backgroundColor: 'rgba(255, 145, 77, 0.1)' }}
                    >
                      <Ionicons name="receipt-outline" size={32} color="#FF8C42" />
                    </View>
                    <Text className="text-[16px] font-semibold text-[#111827] mb-2"
                    style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
                      Aucune dépense
                    </Text>
                    <Text className="text-[14px] text-[#9CA3AF] text-center px-8"
                    style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
                      Commencez à suivre vos dépenses pour ce budget
                    </Text>
                  </View>
                ) : (
                  <View className="gap-3">
                    {expenses.map((expense, index) => (
                      <View
                        key={expense.id}
                        className="bg-white rounded-2xl p-4 flex-row items-center"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: '#FF8C42',
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.04,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        {/* Icon catégorie */}
                        <View className="w-12 h-12 rounded-2xl bg-[#FFF4ED] items-center justify-center mr-4">
                          <Ionicons name="wallet" size={24} color="#FF8C42" />
                        </View>

                        {/* Info dépense */}
                        <View className="flex-1 pr-3">
                          <Text className="text-[16px] font-semibold text-[#111827] mb-0.5"
                          style={{fontFamily: 'Montserrat_400Regular', color:"#000"}}>
                            {expense.name}
                          </Text>
                          
                          <View className="flex-row items-center gap-2">
                            <View className="flex-row items-center">
                              <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                              <Text className="text-[13px] text-[#9CA3AF] ml-1"
                              style={{fontFamily: 'Montserrat_400Regular'}}>
                                {expense.date}
                              </Text>
                            </View>
                            
                            {expense.description && (
                              <>
                                <View className="w-1 h-1 rounded-full bg-[#E5E7EB]" />
                                <Text className="text-[13px] text-[#6B7280] flex-1" numberOfLines={1}>
                                  {expense.description}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>

                        {/* Montant + Actions */}
                        <View className="items-end">
                          <Text className="text-[18px] font-bold text-[#111827] mb-2">
                            {expense.amount.toFixed(2)}€
                          </Text>
                          <TouchableOpacity
                            className="w-9 h-9 rounded-xl bg-[#FEF2F2] items-center justify-center"
                            onPress={() => {
                              if (confirm(`Supprimer "${expense.name}" ?`)) {
                                deleteExpense(expense.id);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={16} color="#F64040" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </View>
</Modal> 
</View>
);
}
// Pecto ici en haut 

const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfilMain"
        component={Budget}
        options={({ navigation }) => ({
          headerTitle: "Mon Budget",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: "Shrikhand_400Regular", 
            fontSize: 28,
            color: "#FF8C42",
            // fontWeight: 'bold' // Tu peux laisser, mais Shrikhand est déjà gras par défaut
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={40} style={{ marginLeft: 15, color:"#6DDB31" }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
