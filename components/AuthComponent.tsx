import { useRouter } from "expo-router";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { auth } from "../firebaseConfig";
import ThemedButton from "./themed-button";
import ThemedText from "./themed-text";


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
      <ThemedText type="title" style={styles.title}>Bienvenu sur Daily Nest !</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        selectionColor="#f07d25ff"
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
      <View>
        <ThemedButton label="S'inscrire"onPress={handleSignIn} style={styles.signUpButton}>          
          
          </ThemedButton>

        <ThemedButton label="GRH" onPress={() => router.push("/Inscription")} style={styles.signUpButton}>
          </ThemedButton> 
          <View style={styles.container}>
        
    
      </View>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 2,  backgroundImage:"assets/images/fond_ecran_etoile.png" , zIndex: -1},
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20, marginTop: 110,},
  input: { height: 40, borderColor: "bleu", borderWidth: 1, marginBottom: 10,marginHorizontal: 50, paddingHorizontal: 20 ,borderRadius: 15},
  signUpText: { color: "white", fontWeight: "bold" },
  signUpButton: { padding: 10, borderRadius: 15, paddingVertical: 14, marginHorizontal: 50,
    paddingHorizontal: 14,
    backgroundColor: "#f07d25ff",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,},
  //bg : {flex:1}
 
});
