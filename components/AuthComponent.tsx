import { useRouter } from "expo-router";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function AuthComponent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        router.replace("/drawer/Acceuil");
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert("Erreur Connexion", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert("Déconnecté !");
    } catch (error: any) {
      Alert.alert("Erreur Déconnexion", error.message);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenu sur Daily Nest !</Text>
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
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSignIn} style={styles.signUpButton}>
          <Text style={styles.signUpText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/Inscription")} style={styles.signUpButton}>
          <Text style={styles.signUpText}>S'inscrire</Text>
          </TouchableOpacity> 
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { height: 40, borderColor: "gray", borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 20, alignItems: "center" },
  signUpText: { color: "white", fontWeight: "bold" },
  signUpButton: { backgroundColor: "#00b7ff9a", padding: 10, borderRadius: 5 },
});
