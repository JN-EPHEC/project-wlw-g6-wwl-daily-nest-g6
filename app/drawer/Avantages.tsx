import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { TouchableOpacity, } from "react-native";
export function Avantages() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}> Avantages</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfilMain"
        component={Avantages}
        options={({ navigation }) => ({
          headerTitle: "Mes avantages",
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
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});