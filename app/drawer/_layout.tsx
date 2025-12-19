import { Drawer } from "expo-router/drawer";

import "react-native-reanimated";



export default function DrawerLayout() {

  return (


    <Drawer screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Acceuil" options={{ title: "Accueil" }} />
      <Drawer.Screen name="Budget" options={{ title: "Budget" }} />
      <Drawer.Screen name="Avantages" options={{ title: "Avantages" }} />
      <Drawer.Screen name="profil" options={{ title: "Profil" }} />
      <Drawer.Screen name= "Famille"  options = {{title: "Famille"}} />
      <Drawer.Screen name="Parametres" options={{ title: "Paramètres" }} />
      <Drawer.Screen name="Déconnexion" options={{ title: "Déconnexion" }} />
    </Drawer>)}
