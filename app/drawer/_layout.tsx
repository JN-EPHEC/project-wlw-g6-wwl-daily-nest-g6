import { Drawer } from "expo-router/drawer";
import "react-native-reanimated";

export default function DrawerLayout() {
  return (
    <Drawer screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Acceuil" options={{ title: "Accueil" }} />
      <Drawer.Screen name="Carnetfamiliale" options={{ title: "Carnet Familial" }} />
      <Drawer.Screen name="ListeCourse" options={{ title: "Liste de Courses" }} />
      <Drawer.Screen name="Budget" options={{ title: "Budget" }} />
      <Drawer.Screen name="Invitation" options={{ title: "Invitations" }} />
      <Drawer.Screen name="profil" options={{ title: "Profil" }} />
      <Drawer.Screen name="Parametres" options={{ title: "Paramètres" }} />
      <Drawer.Screen name="Avantages" options={{ title: "Avantages" }} />
      <Drawer.Screen name="Deconnexion" options={{ title: "Déconnexion" }} />
    </Drawer>
  );
}