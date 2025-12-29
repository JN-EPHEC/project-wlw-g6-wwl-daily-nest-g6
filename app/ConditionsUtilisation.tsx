import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TermsOfUse() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffbf00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions générales d'utilisation</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : 24 décembre 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
        <Text style={styles.paragraph}>
          En accédant et en utilisant l'application Daily Nest, vous acceptez d'être lié par ces conditions 
          générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
        </Text>

        <Text style={styles.sectionTitle}>2. Description du service</Text>
        <Text style={styles.paragraph}>
          Daily Nest est une application de gestion familiale qui permet aux utilisateurs de :
        </Text>
        <Text style={styles.listItem}>• Organiser et planifier des tâches familiales</Text>
        <Text style={styles.listItem}>• Gérer un calendrier partagé</Text>
        <Text style={styles.listItem}>• Suivre un budget personnel ou familial</Text>
        <Text style={styles.listItem}>• Créer des listes de courses</Text>
        <Text style={styles.listItem}>• Attribuer et suivre des récompenses</Text>
        <Text style={styles.listItem}>• Communiquer via un chat familial</Text>

        <Text style={styles.sectionTitle}>3. Création de compte</Text>
        <Text style={styles.paragraph}>
          Pour utiliser Daily Nest, vous devez :
        </Text>
        <Text style={styles.listItem}>• Avoir au moins 13 ans (ou l'âge minimum légal dans votre pays)</Text>
        <Text style={styles.listItem}>• Fournir des informations exactes et complètes lors de l'inscription</Text>
        <Text style={styles.listItem}>• Maintenir la sécurité de votre mot de passe</Text>
        <Text style={styles.listItem}>• Ne pas partager votre compte avec d'autres personnes</Text>
        <Text style={styles.listItem}>• Nous informer immédiatement de toute utilisation non autorisée</Text>

        <Text style={styles.sectionTitle}>4. Utilisation acceptable</Text>
        <Text style={styles.paragraph}>
          Vous vous engagez à utiliser Daily Nest uniquement à des fins légales et de manière conforme à ces conditions. 
          Il est strictement interdit de :
        </Text>
        <Text style={styles.listItem}>• Utiliser l'application pour des activités illégales</Text>
        <Text style={styles.listItem}>• Harceler, menacer ou diffamer d'autres utilisateurs</Text>
        <Text style={styles.listItem}>• Partager du contenu offensant, violent ou inapproprié</Text>
        <Text style={styles.listItem}>• Tenter de pirater ou compromettre la sécurité de l'application</Text>
        <Text style={styles.listItem}>• Copier, modifier ou distribuer le contenu de l'application</Text>
        <Text style={styles.listItem}>• Utiliser des robots ou scripts automatisés</Text>

        <Text style={styles.sectionTitle}>5. Familles et partage</Text>
        <Text style={styles.paragraph}>
          L'application permet de créer des groupes familiaux pour partager des informations. En invitant 
          des membres à votre famille :
        </Text>
        <Text style={styles.listItem}>• Vous confirmez avoir leur autorisation de les ajouter</Text>
        <Text style={styles.listItem}>• Vous acceptez de partager certaines données avec eux</Text>
        <Text style={styles.listItem}>• Vous êtes responsable des mineurs ajoutés à votre famille</Text>
        <Text style={styles.listItem}>• Vous pouvez retirer des membres ou quitter une famille à tout moment</Text>

        <Text style={styles.sectionTitle}>6. Contenu utilisateur</Text>
        <Text style={styles.paragraph}>
          Vous conservez tous les droits sur le contenu que vous créez dans Daily Nest (tâches, événements, notes, etc.). 
          Cependant, vous nous accordez une licence pour stocker, traiter et afficher ce contenu dans le cadre 
          de la fourniture de nos services.
        </Text>

        <Text style={styles.sectionTitle}>7. Propriété intellectuelle</Text>
        <Text style={styles.paragraph}>
          Daily Nest et tous ses éléments (design, logo, fonctionnalités, code) sont protégés par les lois 
          sur la propriété intellectuelle. Vous n'êtes pas autorisé à :
        </Text>
        <Text style={styles.listItem}>• Copier ou reproduire l'application</Text>
        <Text style={styles.listItem}>• Créer des œuvres dérivées</Text>
        <Text style={styles.listItem}>• Utiliser nos marques sans autorisation</Text>
        <Text style={styles.listItem}>• Faire de l'ingénierie inverse de l'application</Text>

        <Text style={styles.sectionTitle}>8. Disponibilité du service</Text>
        <Text style={styles.paragraph}>
          Nous nous efforçons de maintenir Daily Nest accessible 24h/24 et 7j/7, mais nous ne garantissons pas 
          une disponibilité ininterrompue. Nous pouvons suspendre le service pour :
        </Text>
        <Text style={styles.listItem}>• Maintenance programmée ou urgente</Text>
        <Text style={styles.listItem}>• Mises à jour et améliorations</Text>
        <Text style={styles.listItem}>• Problèmes techniques imprévus</Text>
        <Text style={styles.listItem}>• Circonstances indépendantes de notre volonté</Text>

        <Text style={styles.sectionTitle}>9. Limitation de responsabilité</Text>
        <Text style={styles.paragraph}>
          Daily Nest est fourni "tel quel" sans garantie d'aucune sorte. Nous ne sommes pas responsables :
        </Text>
        <Text style={styles.listItem}>• Des pertes de données dues à des problèmes techniques</Text>
        <Text style={styles.listItem}>• Des erreurs ou omissions dans le contenu</Text>
        <Text style={styles.listItem}>• Des dommages indirects résultant de l'utilisation</Text>
        <Text style={styles.listItem}>• Des interactions entre utilisateurs</Text>

        <Text style={styles.sectionTitle}>10. Suspension et résiliation</Text>
        <Text style={styles.paragraph}>
          Nous nous réservons le droit de suspendre ou résilier votre compte si :
        </Text>
        <Text style={styles.listItem}>• Vous violez ces conditions d'utilisation</Text>
        <Text style={styles.listItem}>• Vous utilisez l'application de manière abusive</Text>
        <Text style={styles.listItem}>• Votre compte reste inactif pendant plus de 2 ans</Text>
        <Text style={styles.listItem}>• Cela est nécessaire pour des raisons légales</Text>
        <Text style={styles.paragraph}>
          Vous pouvez également supprimer votre compte à tout moment depuis les paramètres.
        </Text>

        <Text style={styles.sectionTitle}>11. Modifications des conditions</Text>
        <Text style={styles.paragraph}>
          Nous pouvons modifier ces conditions à tout moment. Les modifications importantes vous seront 
          notifiées par email ou via l'application. Votre utilisation continue après ces modifications 
          constitue votre acceptation des nouvelles conditions.
        </Text>

        <Text style={styles.sectionTitle}>12. Loi applicable et juridiction</Text>
        <Text style={styles.paragraph}>
          Ces conditions sont régies par les lois françaises. Tout litige sera soumis à la juridiction 
          exclusive des tribunaux français.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant ces conditions d'utilisation, contactez-nous à :
        </Text>
        <Text style={styles.contactInfo}>Email : contact@dailynest.app</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En utilisant Daily Nest, vous reconnaissez avoir lu et accepté ces conditions générales d'utilisation.
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
