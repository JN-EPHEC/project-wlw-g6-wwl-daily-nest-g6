import ThemedText from "@/components/themed-text";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Landing() {
  return (
    <View style={styles.container}>
      <ThemedText type='defaultSemiBold'style={styles.title}>Bienvenue</ThemedText>

      <Link href="/auth" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Aller à authentification</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/storage" asChild>
        <TouchableOpacity
          style={StyleSheet.flatten([styles.button, styles.secondary])}
        >
          <Text style={styles.buttonText}>Aller au storage</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/firestore" asChild>
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.button,
            { backgroundColor: "#489ed1" },
          ])}
        >
          <Text style={styles.buttonText}>Exemple Firestore (CRUD)</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 24 },
  button: {
    backgroundColor: "#e59306ff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    minWidth: "80%",
    alignItems: "center",
    marginBottom: 12,
  },
  secondary: { backgroundColor: "#68cb30" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});