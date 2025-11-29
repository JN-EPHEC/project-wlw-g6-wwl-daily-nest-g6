
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

import chat from "../tabs/chat";
import Home from "../tabs/Home";
import Recompense from "../tabs/Recompense";
import ToDo from "../tabs/ToDo";
import Carnetfamiliale from "./Carnetfamiliale";
import ListeCourse from "./ListeCourse";

export type TabMenuParamList = {
  Home: undefined;
  ToDo: undefined;
  ListeCourse: undefined;
  popUpRac: undefined;
  Carnetfamiliale: undefined;
  Recompense: undefined;
  chat: undefined;
};

const Tab = createBottomTabNavigator<TabMenuParamList>();

export function Acceuil() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalScreen, setModalScreen] = useState<"calendrier" | "todo" | "shopping" | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  const [todoTitle, setTodoTitle] = useState("");
  const [todoPerson, setTodoPerson] = useState("");
  const [todoDate, setTodoDate] = useState("");

  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
const [selectedListId, setSelectedListId] = useState<string>("");
const [newListName, setNewListName] = useState("");
const [shoppingItem, setShoppingItem] = useState("");



  const goBack = () => { setModalScreen (null)};
  const [modalVisible, setModalVisible] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
  if (!user) return;

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




  const saveEvent = async () => {
    if (!eventTitle || !eventDate || !eventTime) {
      alert ("Veuillez remplir tous les champs svpp");
      return;
    }
    try {
    await addDoc(
        collection(db, "users", user?.uid!, "calendrier"), { 
      title: eventTitle,
      date: eventDate,
      time: eventTime,
    });
    alert ("Événement sauvegardé !");

    setEventTitle("");
    setEventDate("");
    setEventTime("");

    setModalVisible(false);
  } 
  
  catch (err) {
    console.log(err);
    alert("Impossible de sauvegarder l'événement.");
  }
};

  const openModal = (screen: "calendrier" | "todo" | "shopping") => {
    setModalScreen(screen);
    setMenuVisible(true);
  };

  const closeModal = () => {
    setMenuVisible(false);
    setModalScreen(null);
  };

  const renderModalContent = () => {
  
  const saveEvent = async () => {
    if (!eventTitle || !eventDate || !eventTime) {
      alert ("Veuillez remplir tous les champs svpp");
      return;
    }
    try {
    await addDoc (collection(db, "users", user?.uid!, "calendrier"), { 
      title: eventTitle,
      date: eventDate,
      time: eventTime,
    });
    alert("Événement sauvegardé !");

      setEventTitle("");
      setEventDate("");
      setEventTime("");
      setModalScreen(null);
      setMenuVisible(false);
  } 
  
  catch (err) {
    console.log(err);
    alert("Impossible de sauvegarder l'événement.");
  }
};

const saveTodo = async () => {
    if (!todoTitle) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      await addDoc(collection(db, "todos"), {
        title: todoTitle,
      });

      alert("Tâche sauvegardée !");
      setTodoTitle("");
      setModalScreen(null);
      setMenuVisible(false);

    } catch (err) {
      alert("Impossible de sauvegarder la tâche.");
    }
  };

  const saveShopping = async () => {
  if (!shoppingItem) {
    alert("Veuillez remplir le champ produit.");
    return;
  }

  try {
    let listId = selectedListId;

    if (!selectedListId) {
      const newListRef = await addDoc(
        collection(db, "users", user?.uid!, "shopping"),
        { title: shoppingItem }
      );
      listId = newListRef.id;
    }

    await addDoc(
      collection(db, "users", user?.uid!, "shopping", listId, "items"),
      { name: shoppingItem, checked: false }
    );

    alert("Produit ajouté !");
    setShoppingItem("");
    setSelectedListId("");
    setNewListName("");
    setModalScreen(null);
    setMenuVisible(false);
  } catch (err) {
    alert("Impossible de sauvegarder.");
  }
};


    switch (modalScreen) { 

    case "calendrier":
      return (
        <View style={styles.modalInnerContainer}>

          <View style={styles.modalHeader}>
          <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back-outline" size={26} color="#00d0ffff"/>
            </TouchableOpacity>
            </View>

             <Text style={styles.modalTitle}>Nouvel Événement</Text>

          <TextInput 
          placeholder="Titre" 
          value={eventTitle} 
          onChangeText={setEventTitle} 
      
          style={styles.inputWeb} />
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
            <TouchableOpacity style={styles.saveButton} onPress={saveEvent}>
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
   
        </View>
      );

    case "todo":
      return (
        <View style={styles.modalInnerContainer}>

          <View style={styles.modalHeader}>
          <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back-outline" size={26} color="#00d0ffff"/>
            </TouchableOpacity>
            </View>

          <Text style={styles.modalTitle}>Nouvelle Tâche</Text>

          <TextInput 
          placeholder="Titre"
           value={todoTitle}
            onChangeText={setTodoTitle} 
            style={styles.inputWeb} />
          

            <TouchableOpacity style={styles.saveButton} onPress={saveTodo}>
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>

        </View>
      );
    case "shopping":
  return (
    <View style={styles.modalInnerContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back-outline" size={26} color="#00d0ff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.modalTitle}>Nouvelle Liste de Course</Text>

      <Text style={{ fontSize: 16, marginBottom: 5 }}>Choisir une liste existante</Text>
      <Picker
  selectedValue={selectedListId}
  onValueChange={(val) => setSelectedListId(val)}
  style={{ backgroundColor: "#f1f1f1", marginBottom: 10, borderRadius: 10 }}
>
  <Picker.Item label="Créer une nouvelle liste" value="" />
  {shoppingLists.map((list) => (
    <Picker.Item key={list.id} label={list.title} value={list.id} />
  ))}
</Picker>

      {!selectedListId && (
        <TextInput
          placeholder="Nom de la nouvelle liste"
          value={newListName}
          onChangeText={setNewListName}
          style={styles.inputWeb}
        />
      )}

      <TextInput
        placeholder="Nom du produit"
        value={shoppingItem}
        onChangeText={setShoppingItem}
        style={styles.inputWeb}
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveShopping}>
        <Text style={styles.saveButtonText}>Sauvegarder</Text>
      </TouchableOpacity>
    </View>
  );

    default:
      return null;
  }
};

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#ffb700ff",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { height: 60, paddingHorizontal: 0 },
          tabBarItemStyle: { flex: 1, alignItems: "center", justifyContent: "center" },
          tabBarIcon: ({ color }) => {
            let iconName: React.ComponentProps<typeof Ionicons>['name'] = "home-outline";
            if (route.name === "Home") iconName = "home-outline";
            if (route.name === "ToDo") iconName = "list-outline";
            if (route.name === "popUpRac") iconName = "add-circle";
            if (route.name === "ListeCourse") iconName = "cart-outline";
            if (route.name === "Carnetfamiliale") iconName = "people-outline";
            return <Ionicons name={iconName} size={24} color={color} />;
          },        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="ToDo" component={ToDo} />
        <Tab.Screen
          name="popUpRac"
          component={() => null}
          options={{
            tabBarButton: () => (
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={{ position: "absolute", bottom: 20, right: 20, zIndex: 10 }}
              >
                <Ionicons name="add-circle" size={60} color="#ffbf00" />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="ListeCourse" component={ListeCourse} />
        <Tab.Screen name="Carnetfamiliale" component={Carnetfamiliale} />
      </Tab.Navigator>

     
      
      <Modal visible={menuVisible} transparent animationType="slide">
  <TouchableOpacity
    style={styles.modalContainer}
    activeOpacity={1}
    onPress={() => setMenuVisible(false)}  
  >
    <TouchableOpacity
      activeOpacity={1}
      style={styles.modalContent}
      onPress={(e) => e.stopPropagation()}  
    >
      <TouchableOpacity
        style={{ position: "absolute", top: 10, right: 10 }}
        onPress={() => setMenuVisible(false)} 
      >
        <Ionicons name="close" size={30} color="black" />
      </TouchableOpacity>

      {!modalScreen && (
        <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 20 }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalScreen("calendrier")}>
            <Ionicons name="calendar-outline" size={30} color="white" />
            <Text style={styles.buttonText}>Événement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalScreen("todo")}>
            <Ionicons name="list-outline" size={30} color="white" />
            <Text style={styles.buttonText}>Tâche</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalScreen("shopping")}>
            <Ionicons name="cart-outline" size={30} color="white" />
            <Text style={styles.buttonText}>Course</Text>
          </TouchableOpacity>
        </View>
      )}

      {modalScreen && renderModalContent()}
    </TouchableOpacity>
  </TouchableOpacity>
</Modal>

    </View> 
  );
}

const Stack = createNativeStackNavigator();
export default function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Acceuil"
        component={Acceuil}
        options={({ navigation }) => ({
          headerTitle: "Accueil",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={26} style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", marginRight: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate("Recompense")}>
                <Ionicons name="heart-outline" size={24} color="#ff005d" style={{ marginRight: 15 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("chat")}>
                <Ionicons name="chatbubble-outline" size={24} color="#00ff91" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen name="Recompense" component={Recompense} />
      <Stack.Screen name="chat" component={chat} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },


  modalContent: {
    width: "80%",
    marginTop: 60,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },


  iconButton: {
    backgroundColor: "#00d0ffff",
    borderRadius: 15,
    padding: 10,
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },

  buttonText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: "#eeeeeef4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", 
    padding: 20,
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
  backButton: {
  position: "absolute",
  left: 10,
  top: 10,
  zIndex: 10,
  padding: 5,
},
modalTitle: {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 15,
  color: "#00d0ffff",
  textAlign: "center",
  width: "100%",
},
modalInnerContainer: {
  width: "100%",
  justifyContent: "center",
  marginBottom: 12,        
  paddingHorizontal: 20,
},

modalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: 15,
},
saveButton: {
  backgroundColor: "#00d0ffff",
  borderRadius: 50,
  paddingVertical: 12,
  paddingHorizontal: 20,
  marginTop: 20,
  alignItems: "center",
},

saveButtonText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 16,
},
closeModalButton: {
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 10,
  padding: 5,
},






});

