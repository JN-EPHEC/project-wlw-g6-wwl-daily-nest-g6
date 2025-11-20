import ThemedButton from "@/components/themed-button";
import ThemedText from "@/components/themed-text";
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
        <Ionicons name="arrow-back" size={24} color="#ff9d009a" />
      </TouchableOpacity>

    <View style={styles.container}>
      <ThemedText  type='title' style={styles.title}>Création de compte</ThemedText>

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
        secureTextEntry
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
      <ThemedButton
  onPress={handleSignUp}
  style={[
    styles.signUpButton,
    { opacity: isFormValid ? 1 : 0.5 } 
  ]}
  disabled={!isFormValid} 
>
  <ThemedText type='subtitle' style={{ color: "#fff"}}>S'inscrire</ThemedText>
</ThemedButton>
      </View>

      <View style={{ alignItems: "center", marginTop: 10 }}>
       <ThemedButton onPress={() => router.push("/auth")}>
       <ThemedText type="link">Vous avez déja un compte ?</ThemedText>
       </ThemedButton>
    </View>
      
      <Modal visible={showWelcome} transparent animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <ThemedText type="subtitle"style={styles.modalText}></ThemedText>Bienvenue sur<br></br><ThemedText type='title'>Daily Nest</ThemedText>
                <Text>Votre compte a été créé avec succès.</Text>
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
  input: { height: 40, borderColor: "#FF914D", borderWidth: 1, marginBottom : 10, paddingHorizontal: 10, borderRadius: 10, },

  modalContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
   paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
},
modalContent: {
  width: 250,
  padding: 20,
  backgroundColor: "white",
  borderRadius: 15,
  alignItems: "center",
},

  modalText: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  closeButton: {
    marginTop: 10,
    padding: 5,
  },
  closeText: { fontSize: 18, fontWeight: "bold" },

  signUpButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 15,
    backgroundColor: "#ec740cff",
    color: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  
},
signUpText: {
  color: "white",               
  fontSize: 16,
  fontWeight: "bold",
},
});

