
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
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

const [selectedCalendarType, setSelectedCalendarType] = useState("personal");
const [families, setFamilies] = useState<any[]>([]);
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
  // Reset quand on change de calendrier
  setEvents({});
  setItems({});
  setSelectedDate("");
}, [selectedCalendarType, selectedFamily]);


useEffect(() => {
  if (!uid) return;

  if (selectedCalendarType === "personal") {
    const unsubscribe = onSnapshot(collection(db, "users", uid, "calendar"), (snapshot) => {
      const newEvents: any = {};
      const newItems: any = {};

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
  }

  if (selectedCalendarType === "family" && selectedFamily) {
    const unsubscribe = onSnapshot(
      collection(db, "users", selectedFamily.ownerId, "families", selectedFamily.id, "calendar"),
      (snapshot) => {
        const newEvents: any = {};
        const newItems: any = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          newEvents[data.date] = { marked: true, dotColor: "#ff0000" };

          if (!newItems[data.date]) newItems[data.date] = [];
          newItems[data.date].push({ id: doc.id, title: data.title, time: data.time });
        });

        setEvents(newEvents);
        setItems(newItems);
      }
    );

    return () => unsubscribe();
  }
}, [selectedCalendarType, selectedFamily, uid]);

const saveEvent = async () => {
  if (!eventTitle || !eventDate || !eventTime) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  try {
    let path: any;

    if (selectedCalendarType === "personal") {
      if (!uid) return; // sécurité
      path = collection(db, "users", uid, "calendar");
    } else {
      if (!selectedFamily || !selectedFamily.ownerId) return;
      path = collection(db, "users", selectedFamily.ownerId, "families", selectedFamily.id, "calendar");
    }

    if (editingIndex !== null) {
      const ev = items[eventDate][editingIndex];
      const docRef = doc(path, ev.id);
      await updateDoc(docRef, { title: eventTitle, time: eventTime });
    } else {
      await addDoc(path, { title: eventTitle, date: eventDate, time: eventTime });
    }

    alert("Événement sauvegardé !");
    setModalVisible(false);
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
    if (!uid) {
  Alert.alert("Erreur", "Utilisateur non connecté");
  return;
}
  Alert.alert(
    "Confirmer la suppression",
    "Êtes-vous sûr de vouloir supprimer cet événement ?",
    [
      { text: "Non", style: "cancel" },
      { text: "Oui", onPress: async () => {
          try {
            let docRef;
            if (selectedCalendarType === "personal") {
              docRef = doc(db, "users", uid, "calendar", eventId);
            } else {
              docRef = doc(db, "users", selectedFamily.ownerId, "families", selectedFamily.id, "calendar", eventId);
            }
            await deleteDoc(docRef);
            alert("Événement supprimé !");
          } catch (err) {
            alert("Impossible de supprimer l'événement.");
          }
        } 
      }
    ]
  );
};

  
  useEffect(() => {
  if (!email) return;

  const unsubscribe = onSnapshot(collection(db, "users"), async (snapshot) => {
    const fams: any[] = [];
    for (const docUser of snapshot.docs) {
      const famCol = collection(db, "users", docUser.id, "families");
      const famSnap = await getDocs(famCol);
      famSnap.forEach(f => {
        const data = f.data();
        if (data.members.includes(email)) {
          fams.push({ id: f.id, ownerId: docUser.id, ...data });
        }
      });
    }
    setFamilies(fams);
  });

  return () => unsubscribe();
}, [email]);

    


  return (
    
<View style={styles.calendarContainer}>
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
    <select
      style={{
        width: "100%",
        fontSize: 16,
        padding: 6,
        borderRadius: 10,
        borderWidth: 0,
        outline: "none",
        backgroundColor: "transparent"
      }}
      value={selectedCalendarType === "family" && selectedFamily ? selectedFamily.id : "personal"}
      onChange={(e) => {
        if (e.target.value === "personal") {
          setSelectedCalendarType("personal");
          setSelectedFamily(null);
        } else {
          const fam = families.find((f) => f.id === e.target.value);
          setSelectedFamily(fam);
          setSelectedCalendarType("family");
        }
      }}
    >
      <option value="personal">Calendrier personnel</option>
      <option disabled>── Calendriers famille ──</option>
      {families.map((f, i) => (
        <option key={i} value={f.id}> {f.name}</option>
      ))}
    </select>
  </View>
</View>

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
  <View style={{ alignItems: "center", gap: 15 }}>
  <Text>Pas d'événement</Text>
  <TouchableOpacity
    onPress={() => {
      setModalViewVisible(false);
      setIsEditing(false);
      setEventTitle("");
      setEventDate(selectedDate);
      setEventTime("");
      setEditingIndex(null);
      setModalVisible(true);
    }}
    style={{
      backgroundColor: "#ffbf00ff",
      padding: 10,
      borderRadius: 50,
      marginTop: 10
    }}
  >
    <Ionicons name="add" size={26} color="white" />
  </TouchableOpacity>
</View>

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

