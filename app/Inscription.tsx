import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    createUserWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";


export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
   const [birthDate, setBirthDate] = useState("");

  const handleSignUp = async () => {
    console.log("Bouton cliqué !");
  Alert.alert("Test", "Bouton fonctionne");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowWelcome(true);
    } catch (error: any) {
      Alert.alert("Erreur Inscription", error.message);
    }
  };

  const handleCloseModal = () => {
    setShowWelcome(false);
    router.replace("/drawer/Acceuil");
  }
  const isFormValid = firstName && lastName && email && password.length >= 6;


  return (

    <View style={{ flex: 1, padding: 20 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
        <Ionicons name="arrow-back" size={24} color="#00b7ff9a" />
      </TouchableOpacity>

    <View style={styles.container}>
      <Text style={styles.title}>Création de compte</Text>

    <TextInput
    style={styles.input}
    placeholder="Prénom"
    value={firstName}
    onChangeText={setFirstName}
    />
    <TextInput
    style={styles.input}
    placeholder="Nom"
    value={lastName}
    onChangeText={setLastName}
    />

    <TextInput
    style={styles.input}
    placeholder="Email"
    value={email}
    onChangeText={setEmail}
    autoCapitalize="none"
    />
    
    <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />


     <TextInput
  style={styles.input}
  placeholder="Date de naissance (JJ/MM/AAAA)"
  value={birthDate}
  keyboardType="numeric"
  maxLength={10} 
  onChangeText={(text) => {
    
    const digits = text.replace(/\D/g, "");

    let formatted = digits;

    if (digits.length > 2 && digits.length <= 4) {
      
      formatted = digits.slice(0,2) + "/" + digits.slice(2);
    } else if (digits.length > 4) {
      
      formatted = digits.slice(0,2) + "/" + digits.slice(2,4) + "/" + digits.slice(4,8);
    }

    setBirthDate(formatted);
  }}
/>

      <View style={{ alignItems: "center", marginTop: 20 }}>
      <TouchableOpacity
  onPress={handleSignUp}
  style={[
    styles.signUpButton,
    { opacity: isFormValid ? 1 : 0.5 } 
  ]}
  disabled={!isFormValid} 
>
  <Text style={styles.signUpText}>S'inscrire</Text>
</TouchableOpacity>
      </View>

      <View style={{ alignItems: "center", marginTop: 10 }}>
       <TouchableOpacity onPress={() => router.push("/auth")}>
       <Text style={{ color: "navy", textDecorationLine: "underline", fontSize: 12 }}>Vous avez déja un compte ?</Text>
       </TouchableOpacity>
    </View>
      
      <Modal visible={showWelcome} transparent animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalText}>Bienvenue sur Daily Nest ! Votre compte a été créé avec succès.</Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                    <Text style={styles.closeText}>x</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </ View> 
    </View>
    
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { height: 40, borderColor: "gray", borderWidth: 1, marginBottom : 10, paddingHorizontal: 10 },

  modalContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  width: 250,
  padding: 20,
  backgroundColor: "white",
  borderRadius: 10,
  alignItems: "center",
},

  modalText: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  closeButton: {
    marginTop: 10,
    padding: 5,
  },
  closeText: { fontSize: 18, fontWeight: "bold" },

  signUpButton: {
  backgroundColor: "#00b7ff9a",      
  paddingVertical: 10,          
  paddingHorizontal: 25,        
  borderRadius: 5,             
  alignItems: "center",
  marginTop: 10,
},
signUpText: {
  color: "white",               
  fontSize: 16,
  fontWeight: "bold",
},
});