import { Drawer } from "expo-router/drawer";

import React from "react";
import "react-native-reanimated";
import { ThemeProvider } from "../Theme";




export default function DrawerLayout() {
  return (
    <ThemeProvider>
    <Drawer screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Acceuil" options={{ title: "Accueil"}} />
      <Drawer.Screen name="Budget" options={{ title: "Budget" }} />
      <Drawer.Screen name="Avantages" options={{ title: "Avantages" }} />
      <Drawer.Screen name="profil" options={{ title: "Profil" }} />
      <Drawer.Screen name="Famille" options={{ title: "Famille" }} />
      <Drawer.Screen name="Invitations" options={{ title: "Invitations" }} />
      <Drawer.Screen name="Parametres" options={{ title: "Paramètres" }} />
      <Drawer.Screen name="Deconnexion" options={{ title: "Déconnexion" }} />
    </Drawer>
   </ThemeProvider>
 
  );
}

