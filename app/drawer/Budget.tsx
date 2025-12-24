import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
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

    const q = query(collection(db, "families"), where("members", "array-contains", email));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setFamiliesJoined(list);
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
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setBudgets(list);
      });
    } else if (selectedType === "family" && selectedFamily) {
      const budgetsCollection = collection(db, "families", selectedFamily.id, "budgets");
      unsubscribe = onSnapshot(budgetsCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
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
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        // Trier par date (plus récent en premier)
        list.sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('');
          const dateB = b.date.split('/').reverse().join('');
          return dateB.localeCompare(dateA);
        });
        setExpenses(list);
      });
    } else if (selectedType === "family" && selectedFamily) {
      const expensesCollection = collection(db, "families", selectedFamily.id, "budgets", selectedBudget.id, "expenses");
      unsubscribe = onSnapshot(expensesCollection, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('');
          const dateB = b.date.split('/').reverse().join('');
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
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
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
    <View style={styles.container}>
      <Text style={styles.title}>💰 Gestion de Budget</Text>

      {/* Sélecteur Personnel / Famille */}
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
                setSelectedType("personal");
                setSelectedFamily(null);
              } else {
                const fam = familiesJoined.find(f => f.id === value);
                if (fam) {
                  setSelectedFamily(fam);
                  setSelectedType("family");
                }
              }
            }}
            style={{
              width: '100%',
              backgroundColor: 'white',
            }}
          >
            <Picker.Item label="Budget personnel" value="personal" />
            <Picker.Item label="── Budgets famille ──" value="" enabled={false} />
            {familiesJoined.map(f => (
              <Picker.Item key={f.id} label={f.name} value={f.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Bouton pour créer un nouveau budget */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setCreateModalVisible(true)}
      >
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.addButtonText}>Créer un budget</Text>
      </TouchableOpacity>

      {/* Liste des budgets */}
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 20 }}>
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Aucun budget créé</Text>
            <Text style={styles.emptySubText}>Créez votre premier budget pour commencer</Text>
          </View>
        ) : (
          budgets.map((budget) => {
            // Calculer le total des dépenses pour ce budget
            const totalSpent = 0; // On ne peut pas le calculer ici sans charger les dépenses
            return (
              <TouchableOpacity
                key={budget.id}
                style={styles.budgetCard}
                onPress={() => {
                  setSelectedBudget(budget);
                  setExpensesModalVisible(true);
                }}
              >
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (confirm(`Supprimer le budget "${budget.name}" ?`)) {
                        deleteBudget(budget.id);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#f44336" />
                  </TouchableOpacity>
                </View>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetLimit}>Budget: {budget.limit.toFixed(2)}€</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal pour créer un budget */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCreateModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="black" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Nouveau Budget</Text>

            <Text style={styles.label}>Nom du budget</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Cadeaux, Courses, Loisirs..."
              value={budgetName}
              onChangeText={setBudgetName}
            />

            <Text style={styles.label}>Montant limite (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 300"
              keyboardType="numeric"
              value={budgetLimit}
              onChangeText={setBudgetLimit}
            />

            <TouchableOpacity
              style={[styles.submitButton, (!budgetName.trim() || !budgetLimit.trim()) && styles.submitButtonDisabled]}
              onPress={createBudget}
              disabled={!budgetName.trim() || !budgetLimit.trim()}
            >
              <Text style={styles.submitButtonText}>Créer le budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal pour voir/ajouter des dépenses */}
      <Modal
        visible={expensesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setExpensesModalVisible(false);
          setSelectedBudget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setExpensesModalVisible(false);
                setSelectedBudget(null);
              }}
            >
              <Ionicons name="close" size={30} color="black" />
            </TouchableOpacity>

            {selectedBudget && (
              <>
                <Text style={styles.modalTitle}>{selectedBudget.name}</Text>
                
                {/* Indicateur de budget */}
                <View style={styles.budgetIndicator}>
                  <View style={styles.budgetBar}>
                    <View 
                      style={[
                        styles.budgetBarFill, 
                        { 
                          width: `${Math.min((getTotalExpenses() / selectedBudget.limit) * 100, 100)}%`,
                          backgroundColor: getTotalExpenses() > selectedBudget.limit ? '#f44336' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.budgetStats}>
                    <Text style={styles.budgetStatText}>
                      Dépensé: <Text style={{ fontWeight: 'bold', color: getTotalExpenses() > selectedBudget.limit ? '#f44336' : '#333' }}>
                        {getTotalExpenses().toFixed(2)}€
                      </Text>
                    </Text>
                    <Text style={styles.budgetStatText}>
                      Limite: <Text style={{ fontWeight: 'bold' }}>{selectedBudget.limit.toFixed(2)}€</Text>
                    </Text>
                  </View>
                  <Text style={[
                    styles.budgetRemaining,
                    { color: (selectedBudget.limit - getTotalExpenses()) < 0 ? '#f44336' : '#4CAF50' }
                  ]}>
                    {(selectedBudget.limit - getTotalExpenses()) >= 0 ? 'Restant' : 'Dépassement'}: {Math.abs(selectedBudget.limit - getTotalExpenses()).toFixed(2)}€
                  </Text>
                </View>

                {/* Formulaire pour ajouter une dépense */}
                <View style={styles.addExpenseForm}>
                  <Text style={styles.sectionTitle}>Ajouter une dépense</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Nom de la dépense"
                    value={expenseName}
                    onChangeText={setExpenseName}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Montant (€)"
                    keyboardType="numeric"
                    value={expenseAmount}
                    onChangeText={setExpenseAmount}
                  />

                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    placeholder="Description (optionnel)"
                    value={expenseDescription}
                    onChangeText={setExpenseDescription}
                    multiline
                  />

                  <input
                    type="date"
                    value={expenseDate ? (() => {
                      const parts = expenseDate.split('/');
                      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                    })() : ''}
                    onChange={(e) => {
                      const dateParts = e.target.value.split('-');
                      if (dateParts.length === 3) {
                        setExpenseDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      borderWidth: 1,
                      borderColor: '#ffbf00',
                      padding: 10,
                      borderRadius: 10,
                      fontSize: 14,
                      marginTop: 10
                    }}
                  />

                  <TouchableOpacity
                    style={[styles.addExpenseButton, (!expenseName.trim() || !expenseAmount.trim()) && styles.submitButtonDisabled]}
                    onPress={addExpense}
                    disabled={!expenseName.trim() || !expenseAmount.trim()}
                  >
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={styles.addExpenseButtonText}>Ajouter la dépense</Text>
                  </TouchableOpacity>
                </View>

                {/* Liste des dépenses */}
                <Text style={styles.sectionTitle}>Historique des dépenses</Text>
                <ScrollView style={styles.expensesList}>
                  {expenses.length === 0 ? (
                    <Text style={styles.noExpensesText}>Aucune dépense enregistrée</Text>
                  ) : (
                    expenses.map((expense) => (
                      <View key={expense.id} style={styles.expenseCard}>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseName}>{expense.name}</Text>
                          {expense.description ? (
                            <Text style={styles.expenseDescription}>{expense.description}</Text>
                          ) : null}
                          <Text style={styles.expenseDate}>{expense.date}</Text>
                        </View>
                        <View style={styles.expenseRight}>
                          <Text style={styles.expenseAmount}>{expense.amount.toFixed(2)}€</Text>
                          <TouchableOpacity
                            onPress={() => {
                              if (confirm(`Supprimer la dépense "${expense.name}" ?`)) {
                                deleteExpense(expense.id);
                              }
                            }}
                          >
                            <Ionicons name="trash-outline" size={20} color="#f44336" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfilMain"
        component={Budget}
        options={({ navigation }) => ({
          headerTitle: "Mon Budget",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={26} style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: { 
    fontSize: 26, 
    fontWeight: "bold", 
    marginBottom: 20,
    textAlign: "center",
    color: "#ffbf00",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffbf00",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  budgetCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  budgetInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetLimit: {
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 15,
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 500,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffbf00",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ffbf00",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#ffbf00",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  budgetIndicator: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  budgetBar: {
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  budgetBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  budgetStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  budgetStatText: {
    fontSize: 14,
    color: "#666",
  },
  budgetRemaining: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5,
  },
  addExpenseForm: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#fff9e6",
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    gap: 8,
  },
  addExpenseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  expensesList: {
    maxHeight: 300,
  },
  expenseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffbf00",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  expenseDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  expenseRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f44336",
    marginBottom: 5,
  },
  noExpensesText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
});