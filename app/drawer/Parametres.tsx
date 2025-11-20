import ThemedText from '@/components/themed-text';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function Parametres() {
  return (
    <View>
      <View style={styles.container}></View>
      <ThemedText type='title' style={styles.titre}>Paramètres</ThemedText>
      <ThemedText type='defaultSemiBold'>Acceuil</ThemedText>
      <ThemedText type='defaultSemiBold'>Contacts</ThemedText>
      <ThemedText type='defaultSemiBold'>Liste de course</ThemedText>
      <ThemedText type='defaultSemiBold'>Budget</ThemedText>
      <ThemedText type='defaultSemiBold'>Invitation</ThemedText>
      <ThemedText type='defaultSemiBold'>Mon profil</ThemedText>
    </View>
  );
}
const styles = StyleSheet.create({
  titre : {
    flex : 1,
    color: '#6E8B3D',
    marginBottom : 10,
    marginTop : 20,

  },
  container: {
  flex: 1,
    backgroundColor: '#147a5bff',  // 🔥 couleur de fond de toute la page
    padding: 0,
  },
});