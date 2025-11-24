import { Ionicons } from "@expo/vector-icons";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Progress from "react-native-progress";
import { db } from "../../firebaseConfig";

export default function Recompense () {
  const [tasks, setTasks] = useState<any[]>([]);
  const [points, setPoints] = useState(0);


useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "todos"), (snapshot) => {
      const list: any[] = [];
      let total = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ id: doc.id, ...data });
        if (data.completed) total += 10;   
      });

    setTasks(list);
    setPoints(total);

    });

    return () => unsubscribe();
  }, []);

const todolist = async (item: any) => {
    const docRef = doc(db, "todos", item.id);
    await updateDoc(docRef, { completed: !item.completed }); // change completer vers non compléété 
  };

  const progress = Math.min( points / 100, 1); 
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Récompenses</Text>

      <View style={styles.heartContainer}>
      <Ionicons name="heart" size={120} color="#ff4d6d" />
      <Text style={styles.pointsInsideHeart}>{points}</Text>
       </View>

      
      <Progress.Bar
        progress={progress}
        width={300}
        height={15}
        borderRadius={10}
        style={{ marginVertical: 15 }}
      />

      {progress === 1 && (
        <Text style={styles.reward}>Tu as gagné une récompense !</Text>
      )}

      <Text style={styles.subtitle}>Tâches à effectuer :</Text>

      <FlatList
        data={tasks} // task recoit tt la data 
        keyExtractor={(item) => item.id} // chauqye elem clé unique 
        renderItem={({ item }) => ( // comment afficher chauqe item
          <TouchableOpacity
            onPress={() => todolist(item)}
            style={styles.taskItem}
          >
            <Ionicons
              name={item.completed ? "checkbox" : "square-outline"}
              size={26}
              color="#ffbf00ff"
            />
            <Text style={styles.taskText}>{item.title}</Text>
            <Text style={styles.taskPoints}>+10</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  pointsText: { fontSize: 28, fontWeight: "bold", color: "#ffbf00ff" },
  subtitle: { fontSize: 18, fontWeight: "600", marginTop: 25 },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    width: "90%",
    justifyContent: "space-between",
  },
  taskText: { fontSize: 17 },
  taskPoints: { fontSize: 15, color: "#ffbf00ff", fontWeight: "bold" },
  reward: { marginBottom: 10, color: "green", fontSize: 18, fontWeight: "bold" },


  heartContainer: {
  justifyContent: "center",
  alignItems: "center",
  marginVertical: 15,
},

pointsInsideHeart: {
  position: "absolute",
  fontSize: 35,
  fontWeight: "bold",
  color: "white",
},
});

