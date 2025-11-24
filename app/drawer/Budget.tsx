import ThemedText from "@/components/themed-text";
import "global.css";
import React from "react";
import { StyleSheet, Text, View } from "react-native";


export default function Budget() {
  return (
    <View className= "bg-bleue-600 mt-4">
      <ThemedText className="font-bold text-2xl">Budget 💰</ThemedText>
      <Text>Gère ton budget familial ici.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});
