import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Rappels() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rappels 📅</Text>
      <Text>Voici tes rappels quotidiens.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});