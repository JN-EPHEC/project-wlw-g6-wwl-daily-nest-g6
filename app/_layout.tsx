import { Slot } from "expo-router";
import "react-native-reanimated";
import "../global.css";

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { Shrikhand_400Regular } from "@expo-google-fonts/shrikhand";
import { useFonts } from "expo-font";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Shrikhand_400Regular,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  return (
    <View style={{ flex: 1 }}>
      {/* ✅ Slot TOUJOURS monté */}
      <Slot />

      {/* Petit overlay pendant que les fonts chargent */}
      {!fontsLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});
