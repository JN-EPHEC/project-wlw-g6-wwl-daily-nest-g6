import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffbf00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : 24 décembre 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Bienvenue sur Daily Nest. Nous accordons une grande importance à la protection de vos données personnelles. 
          Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons 
          vos informations personnelles lorsque vous utilisez notre application.
        </Text>

        <Text style={styles.sectionTitle}>2. Données collectées</Text>
        <Text style={styles.paragraph}>
          Nous collectons les informations suivantes :
        </Text>
        <Text style={styles.listItem}>• Informations d'identification : prénom, nom, email, date de naissance</Text>
        <Text style={styles.listItem}>• Données d'utilisation : tâches, événements, budgets, récompenses</Text>
        <Text style={styles.listItem}>• Informations de famille : membres, invitations, activités partagées</Text>
        <Text style={styles.listItem}>• Données techniques : appareil, système d'exploitation, journal d'activité</Text>

        <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
        <Text style={styles.paragraph}>
          Vos données sont utilisées pour :
        </Text>
        <Text style={styles.listItem}>• Fournir et améliorer nos services</Text>
        <Text style={styles.listItem}>• Personnaliser votre expérience utilisateur</Text>
        <Text style={styles.listItem}>• Gérer votre compte et vos préférences</Text>
        <Text style={styles.listItem}>• Assurer la sécurité de l'application</Text>
        <Text style={styles.listItem}>• Communiquer avec vous concernant nos services</Text>

        <Text style={styles.sectionTitle}>4. Partage des données</Text>
        <Text style={styles.paragraph}>
          Nous ne vendons jamais vos données personnelles. Vos informations peuvent être partagées uniquement :
        </Text>
        <Text style={styles.listItem}>• Avec les membres de votre famille (selon vos paramètres de partage)</Text>
        <Text style={styles.listItem}>• Avec Firebase/Google pour l'hébergement et l'authentification</Text>
        <Text style={styles.listItem}>• En cas d'obligation légale</Text>

        <Text style={styles.sectionTitle}>5. Sécurité des données</Text>
        <Text style={styles.paragraph}>
          Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger 
          vos données contre tout accès non autorisé, perte ou divulgation. Vos données sont stockées sur des 
          serveurs sécurisés Firebase avec chiffrement.
        </Text>

        <Text style={styles.sectionTitle}>6. Vos droits</Text>
        <Text style={styles.paragraph}>
          Conformément au RGPD, vous disposez des droits suivants :
        </Text>
        <Text style={styles.listItem}>• Droit d'accès à vos données personnelles</Text>
        <Text style={styles.listItem}>• Droit de rectification de vos données</Text>
        <Text style={styles.listItem}>• Droit à l'effacement de vos données</Text>
        <Text style={styles.listItem}>• Droit à la portabilité de vos données</Text>
        <Text style={styles.listItem}>• Droit d'opposition au traitement</Text>
        <Text style={styles.listItem}>• Droit de limitation du traitement</Text>

        <Text style={styles.sectionTitle}>7. Cookies et technologies similaires</Text>
        <Text style={styles.paragraph}>
          Nous utilisons des technologies de stockage local pour améliorer votre expérience utilisateur et 
          maintenir votre session. Vous pouvez gérer ces préférences dans les paramètres de votre appareil.
        </Text>

        <Text style={styles.sectionTitle}>8. Conservation des données</Text>
        <Text style={styles.paragraph}>
          Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services 
          ou tant que votre compte est actif. Si vous supprimez votre compte, vos données seront supprimées 
          dans un délai de 30 jours.
        </Text>

        <Text style={styles.sectionTitle}>9. Données des mineurs</Text>
        <Text style={styles.paragraph}>
          Daily Nest peut être utilisé par des mineurs sous la supervision d'un parent ou tuteur légal. 
          Les parents sont responsables de la gestion du compte et des données de leurs enfants.
        </Text>

        <Text style={styles.sectionTitle}>10. Modifications de la politique</Text>
        <Text style={styles.paragraph}>
          Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Toute modification 
          sera publiée sur cette page avec une nouvelle date de mise à jour. Nous vous encourageons à consulter 
          régulièrement cette page.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, 
          vous pouvez nous contacter à :
        </Text>
        <Text style={styles.contactInfo}>Email : contact@dailynest.app</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En utilisant Daily Nest, vous acceptez cette politique de confidentialité.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffbf00",
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    marginBottom: 10,
    textAlign: "justify",
  },
  listItem: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginLeft: 10,
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 14,
    color: "#ffbf00",
    fontWeight: "600",
    marginTop: 5,
    marginLeft: 10,
  },
  footer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#fff9e6",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ffbf00",
  },
  footerText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
});
