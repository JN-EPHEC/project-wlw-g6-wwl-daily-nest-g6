import { Ionicons } from "@expo/vector-icons";



import { useRouter } from "expo-router";


import { addDoc, collection } from "firebase/firestore";


import React, { useState } from "react";


import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


import { db } from "../../firebaseConfig";





export default function Home() {


  const router = useRouter();


  const [modalVisible, setModalVisible] = useState(false);


  const [eventTitle, setEventTitle] = useState("");


  const [eventDate, setEventDate] = useState(""); 


  const [eventTime, setEventTime] = useState(""); 


  const saveEvent = async () => {


    if (!eventTitle || !eventDate || !eventTime) {


      alert("Veuillez remplir tous les champs.");


      return;


    }





    try {


      await addDoc(collection(db, "events"), { // ajouter un document dans la collection events donc ajouter un evenement dans la bdd firebase


        title: eventTitle,


        date: eventDate,


        time: eventTime,


      });


      alert("Événement ajouté !");


      setModalVisible(false);


      setEventTitle("");


      setEventDate("");


      setEventTime("");


    } catch (err) {


      console.error(err);


      alert("Impossible d'ajouter l'événement.");


    }


  };





  return (


    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>


      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>


        <Ionicons name="add" size={30} color="#ffbf00ff" />


      </TouchableOpacity>





      <Modal transparent visible={modalVisible} animationType="slide"> 


        <View style={styles.modalBackground}> 


          <View style={styles.modalContent}>


            <Text style={{ fontSize: 18, marginBottom: 10 }}>Nouvel événement</Text>





            <TextInput


              placeholder="Titre"


              value={eventTitle}


              onChangeText={setEventTitle}


              style={styles.input}


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


    </View>


  );


}





const styles = StyleSheet.create({


  addButton: {


    padding: 10,


    backgroundColor: "white",


    borderRadius: 50,


    marginBottom: 20,


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


    borderColor: "#ccc",


    padding: 10,


    marginBottom: 10,


    borderRadius: 10,


  },


  inputWeb: {


    marginTop: 10,


    marginBottom: 10,


    padding: 8,


    borderRadius: 10,


    borderWidth: 1,


    borderColor: "#ccc",


    color: "gray",


    fontStyle: "italic",


    width: "100%",


  },


  buttonRow: {


    flexDirection: "row",


    justifyContent: "space-evenly",


    marginTop: 20,


  },


});