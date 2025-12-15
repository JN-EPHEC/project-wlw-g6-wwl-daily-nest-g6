import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

export function Deconnexion() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setShowWelcome(true);
  };

  const handleCloseModal = () => {
  setShowWelcome(false);
  router.replace("/auth");
};

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Voulez-vouz vraiment nous quitter ?</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Oui</Text>
      </TouchableOpacity>
      <Modal visible={showWelcome} transparent animationType="fade">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalText}>Oh dommage 😢… Reviens vite !</Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                    <Text style={styles.closeText}>x</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfilMain"
        component={Deconnexion}
        options={({ navigation }) => ({
          headerTitle: "Deconnexion ",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={26} style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  text: { fontSize: 18, marginBottom: 20, textAlign: "center" },
  buttons: { flexDirection: "row", justifyContent: "space-between", width: "60%", padding: 10, borderRadius: 5 },

   modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(25, 50, 100, 0.95)" // navy très opaque
  },
modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },

modalText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 10,
    textAlign: "center"
  },

  closeButton: {
    marginTop: 10,
    padding: 5,
  },
 closeText: { 
    fontSize: 18, 
    fontWeight: "bold" 
  },
     
   logoutButton: {
    backgroundColor: "#496bbcab",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
   logoutText: { color: "white", fontWeight: "bold", fontSize: 16 },



   
});



     
