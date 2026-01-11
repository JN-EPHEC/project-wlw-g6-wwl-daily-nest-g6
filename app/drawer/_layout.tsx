import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import "react-native-reanimated";
import { auth, db } from "../../firebaseConfig";
import { ThemeProvider } from "../Theme";
import { LogoutModal, performLogout } from "./Deconnexion";

// ✅ Small reusable row item (custom drawer item)
function DrawerRow({
  icon,
  label,
  color,
  badge,
  badgeColor = "#111827",
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center px-4 py-3 rounded-2xl mb-2 bg-[#F8F9FA]"
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${color}22` }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text className="flex-1 text-[15px] font-semibold text-[#111827]"
      style={{ fontFamily: "Montserrat_400Regular", fontSize: 14}}>{label}</Text>

      {badge ? (
        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: badgeColor }}>
          <Text className="text-white text-[12px] font-bold">{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

//  Drawer Content custom. 
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserEmail(user?.email ?? null);

       // Try to get first name from displayName or Firestore profile
      if (user?.displayName) {
        const nameParts = user.displayName.split(" ");
        setFirstName(nameParts[0] || null);
      } else if (user?.uid) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          setFirstName((snap.data()?.firstName as string) ?? null);
        } catch (err) {
          console.log("Failed to load firstName", err);
          setFirstName(null);
        }
      } else {
        setFirstName(null);
      }
    });

    return unsubscribe;
  }, []);

  const openLogoutModal = () => {
    props.navigation.closeDrawer();
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => setShowLogoutModal(false);

  const handleLogout = async () => {
    await performLogout(router);
    setShowLogoutModal(false);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="pt-16 pb-6 px-6"
        style={{ backgroundColor: "#6DDB31", borderBottomRightRadius: 0 }}
      >
        <View className="flex-row items-center mb-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}
          >
            <View className="w-14 h-14 rounded-full bg-white items-center justify-center">
              <Text className="text-[32px]">🐦</Text>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-white text-[20px] font-bold mb-1"
            style={{ fontFamily: "Shrikhand_400Regular", fontWeight: "300" }}>
              Bonjour {firstName ? `${firstName}!` : "!"}
            </Text>
            <Text className="text-white/90 text-[12px] whitespace-pre mt-2"
            style={{ fontFamily: "Montserrat_400Regular", fontWeight: "500" }}>
              {userEmail ?? "Utilisateur connecté"}
            </Text>
          </View>
        </View>

       {/* <View className="flex-row gap-3 mt-2">
          <View className="flex-1 bg-white/20 rounded-2xl p-3">
            <Text className="text-white/80 text-[11px] font-semibold uppercase mb-1">
              Budgets
            </Text>
            <Text className="text-white text-[18px] font-bold">x</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-2xl p-3">
            <Text className="text-white/80 text-[11px] font-semibold uppercase mb-1">
              Familles
            </Text>
            <Text className="text-white text-[18px] font-bold">x</Text>
          </View>
        </View>*/}
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* liste sep (peut mettre des notifs mais azy)
            */}
        <View className="px-4 mb-4">
          <Text className="text-[11px] font-bold text-[#9CA3AF] uppercase mb-3 px-2"
          style={{ fontFamily: "Montserrat_400Regular" }}>
            Principal
          </Text>

          <DrawerRow
            icon="home-outline"
            label="Accueil"
            color="#60AFDF"
            onPress={() => props.navigation.navigate("Acceuil")}
          />
          <DrawerRow
            icon="wallet-outline"
            label="Budget"
            color="#FF914D"
            badge=""
            onPress={() => props.navigation.navigate("Budget")}
          />
          <DrawerRow
            icon="gift-outline"
            label="Avantages"
            color="#6DDB31"
            onPress={() => props.navigation.navigate("Avantages")}
          />
        </View>

        <View className="px-4 mb-4">
          <Text className="text-[11px] font-bold text-[#9CA3AF] uppercase mb-3 px-2"
          style={{ fontFamily: "Montserrat_400Regular" }}>
            Famille
          </Text>

          <DrawerRow
            icon="people-outline"
            label="Famille"
            color="#6DDB31"
            onPress={() => props.navigation.navigate("Famille")}
          />
          <DrawerRow
            icon="mail-outline"
            label="Invitations"
            color="#60AFDF"
            badge=""
            badgeColor="#F64040"
            onPress={() => props.navigation.navigate("Invitations")}
          />
        </View>

        <View className="px-4 mb-4">
          <Text className="text-[11px] font-bold text-[#9CA3AF] uppercase mb-3 px-2"
          style={{ fontFamily: "Montserrat_400Regular" }}>
            Compte
          </Text>

          <DrawerRow
            icon="person-outline"
            label="Profil"
            color="#F64040"
            onPress={() => props.navigation.navigate("profil")}
          />
          <DrawerRow
            icon="settings-outline"
            label="Paramètres"
            color="#4f5156ff"
            onPress={() => props.navigation.navigate("Parametres")}
          />
        </View>

        <View className="h-px bg-[#F1F3F5] mx-6 my-2" />

        <View className="px-4 mt-2">
          <DrawerRow
            icon="log-out-outline"
            label="Déconnexion"
            color="#F64040"
            onPress={openLogoutModal}
          />
          <LogoutModal
            visible={showLogoutModal}
            onClose={closeLogoutModal}
            onConfirm={handleLogout}
          />
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View className="px-6 py-4 border-t border-[#F1F3F5]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[12px] font-semibold text-[#111827]"
            style={{ fontFamily: "Montserrat_400Regular" }}>Daily Nest</Text>
            <Text className="text-[11px] text-[#9CA3AF]"
            style={{ fontFamily: "Montserrat_400Regular" }}>Version 1.0.0</Text>
          </View>

        </View>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <ThemeProvider>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: "#fff", width: 300 },
        }}
      >
        <Drawer.Screen name="Accueil" options={{ title: "Accueil" }} />
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
