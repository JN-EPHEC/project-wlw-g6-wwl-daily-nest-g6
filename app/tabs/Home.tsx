
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { auth, db } from "../../firebaseConfig";

export default function Home() {
  const [events, setEvents] = useState<{ [key: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalViewVisible, setModalViewVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [items, setItems] = useState<{ [key: string]: { id: string;title: string; time: string }[] }>({});
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false); 

  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;



  useEffect(() => {
      if (!uid) return; 

    const unsubscribe = onSnapshot(collection(db, "users", uid, "calendar"), (snapshot) => { 
      const newEvents: { [key: string]: any } = {}; 
      const newItems: { [key: string]: any[] } = {}; 
      snapshot.forEach((doc) => { 
        const data = doc.data();
        newEvents[data.date] = { marked: true, dotColor: "#ffbf00ff" };

        if (!newItems[data.date]) newItems[data.date] = []; 
        newItems[data.date].push({ id: doc.id, title: data.title, time: data.time }); 
      });

      setEvents(newEvents); 
      setItems(newItems); 
    });

    return () => unsubscribe();
  }, [uid]);



  const saveEvent = async () => {
    if (!eventTitle || !eventDate || !eventTime) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    if (!uid) return;

    try {
      if (editingIndex !== null) { 
        const ev = items[eventDate][editingIndex];
        const docRef = doc (db, "users", uid, "calendar", ev.id);
        await updateDoc(docRef, { 
          title: eventTitle,
          time: eventTime,
        });
      } else {
        await addDoc(collection(db, "users", uid, "calendar"), { 
          title: eventTitle,
          date: eventDate,
          time: eventTime,
        });
      }

      alert("Événement sauvegardé !");
      setModalVisible(true);
      setEventTitle("");
      setEventDate("");
      setEventTime("");
      setEditingIndex(null);
      setIsEditing(false);

    } catch (err) {
      alert("Impossible de sauvegarder");
    }
  };
  const deleteEvent = async (eventId: string) => {
    if (!uid) return;
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cet événement ?",
      [
        { text: "Non", style: "cancel" },
        { text: "Oui", onPress: async () => {
            try {
              const docRef = doc(db, "users", uid, "calendar", eventId);
              await deleteDoc(docRef);
              alert("Événement supprimé !");
            } catch (err) {
              alert("Impossible de supprimer l'événement.");
            }
          } 
        }
      ]
    );
  }
    


  return (
    <View style={styles.calendarContainer}>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString); 
          setModalViewVisible(true); 
        }}
        markedDates={{
          ...events, 
          [selectedDate]: { selected: true, selectedColor: "#ffbf00ff" },
        }}
        renderArrow={(direction) => ( 
          <Ionicons
            name={direction === "left" ? "chevron-back" : "chevron-forward"}
            size={19}
            color="#ffbf00ff"
            style={{ marginHorizontal: 50 }}
          />
        )}
        theme={{
          arrowColor: "#ffbf00ff",
          monthTextColor: "#000000ff",
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      <TouchableOpacity onPress={() => { 
        setIsEditing(false);
        setModalVisible(true)
        setEventTitle("");
        setEventDate("");
        setEventTime("");
        setEditingIndex(null);
        
        }} style={styles.addButton}> 
          <Ionicons name="add" size={30} color="#ffbf00ff" /> 
      </TouchableOpacity> 


      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalBackground}> 
          <View style={styles.modalContent}>
           <Text style={{ fontSize: 18, marginBottom: 10 }}>
            {isEditing ? "Modifier l'événement" : "Ajouter un événement"}
             </Text>

            <TextInput 
              placeholder="Titre"
              value={eventTitle}
              onChangeText={setEventTitle} 
              style={styles.inputWeb}
            />
            <input 
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}  
              style={styles.inputWeb}
            />
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)} 
              style={styles.inputWeb}
            />
  <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => setModalVisible(false)}> 
                <Ionicons name="close" size={35} color="red" />
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEvent}>
                <Ionicons name="checkmark" size={35} color="green" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={modalViewVisible} animationType="slide">
  <View style={styles.modalBackground}>
    <View style={styles.modalContent}>
      <TouchableOpacity 
        onPress={() => setModalViewVisible(false)} 
        style={styles.closeButton} 
      >
        <Ionicons name="close" size={24} color="black" /> 
      </TouchableOpacity>

      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Événements du {selectedDate}
      </Text>

      {items[selectedDate]?.length > 0 ? ( 
       items[selectedDate].map((ev, index) => ( 
    <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}> 
      <Text>- {ev.time} : {ev.title}</Text> 
      <View style={{ flexDirection: "row", gap: 15 }}>
      <TouchableOpacity
        onPress={() => deleteEvent(ev.id)} 
      >
        <Ionicons name="trash" size={18} color="red" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          setEventTitle(ev.title);    
          setEventTime(ev.time);     
          setEventDate(selectedDate);  
          setEditingIndex(index);       
          setModalViewVisible(false); 
          setModalVisible(true);     
          setIsEditing(true);  
        }}
      >
        <Ionicons name="pencil" size={18} color="#ffbf00ff" />
      </TouchableOpacity>
    </View>
    </View> 
  ))
) : (
  <Text>Pas d'événement </Text>
)}

    </View>
  </View>
</Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  calendarContainer: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    width: "95%",
    height: 400,
    marginVertical: 10,
    marginHorizontal: 10,
  },
  Button: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000088",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: "80%",
  },
  input: {
    borderWidth: 1,
    marginTop: 10,
    padding: 5,
    borderRadius: 10,
    color: "gray",     
  fontStyle: "italic",

  },
  selectText: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 15,
  },
  inputWeb: {
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    color: "gray",
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 20,
  },
  addButton: {
  position: "absolute",     
  top: 2,       
  right: 10,              
  padding: 10, 
  zIndex: 10, 
},
closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },


});

