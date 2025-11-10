import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Budget() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budget 💰</Text>
      <Text>Gère ton budget familial ici.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});