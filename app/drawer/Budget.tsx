import ThemedText from "@/components/themed-text";
import React from "react";
import { ImageBackground, StyleSheet, View, } from "react-native";

export default function Budget() {
  return (
   <ImageBackground  source={require('@/assets/images/background.png')} 
    style={styles.background}
    resizeMode="contain"
    >
    <View style={styles.container}>
      <ThemedText type='title'style={styles.budget} >Budget 💰</ThemedText>
      <ThemedText type='subtitle'>Gère ton budget familial ici.</ThemedText>
      <ThemedText type='body'>Donc tu appartient à une famille maintenant et tu peux gaspiller ton argent youpiiii !!!</ThemedText>
      <ThemedText type='link'>Tu veux quitter ?</ThemedText>
    </View>
    </ImageBackground>
    

  );
}
//<ThemedButton
  //label="S'inscrire"
  //onPress={handleSignUp}
///>

//<ThemedButton
  //label="Se connecter"
  //onPress={handleSignIn}
  //style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#f8a46b" }}
///>


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  budget : {marginBottom: 10, textAlign: "center" },
  background : {flex:3,  width: "100%",
  height: "100%",},
});
