import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../firebaseConfig";

export default function Todo() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false); 
  

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "todos"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setTasks(list);
    });

    return () => unsubscribe();
  }, []);

  const addTask = async () => {
    if (text.trim() === "") return;

    await addDoc(collection(db, "todos"), {
      title: text,
      completed: false,
    });

    setText("");
  };

  const todolist = async (item: any) => {
    const docRef = doc(db, "todos", item.id);
    await updateDoc(docRef, { completed: !item.completed });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ToDo List</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ajouter une tâche"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity onPress={addTask}>
          <Ionicons name="add-circle" size={40} color="#ffbf00ff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => todolist(item)} style={styles.taskItem}>
            <Ionicons
              name={item.completed ? "checkbox" : "square-outline"}
              size={28}
              color="#ffbf00ff"
            />
            <Text style={[styles.taskText, item.completed && { textDecorationLine: "line-through" }]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, alignSelf: "center" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#cccccc",
  },
  input: { flex: 1, height: 40, fontSize: 16 },
  taskItem: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  taskText: { fontSize: 18, marginLeft: 10 },
});
